import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Initiate a Chapa checkout session for a plan.
// Returns { checkout_url, tx_ref } the client should redirect to.
export const initiateChapaPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        planSlug: z.string().min(1).max(64),
        paymentMethod: z.enum(["chapa", "ebirr"]).optional().default("chapa"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET) throw new Error("CHAPA_SECRET_KEY is not configured");

    // Load plan
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", data.planSlug)
      .eq("active", true)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan) throw new Error("Plan not found");

    // Load user info for Chapa
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? `${userId}@example.com`;
    const fullName = (profile?.display_name ?? email.split("@")[0]).trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ") || "User";

    const tx_ref = `ps-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Determine origin for callback/return URLs
    const origin =
      process.env.PUBLIC_APP_URL ||
      (process.env.VITE_PUBLIC_APP_URL as string | undefined) ||
      "https://id-preview--92fcb336-123f-4b4f-a6d2-bd4b05c6c381.lovable.app";

    const callback_url = `${origin}/api/public/chapa-webhook`;
    const return_url = `${origin}/payment/success?tx_ref=${encodeURIComponent(tx_ref)}`;

    // Insert pending payment row first (uses RLS as the user)
    const { error: insErr } = await supabase.from("subscription_payments").insert({
      user_id: userId,
      plan_id: plan.id,
      tx_ref,
      amount_etb: plan.price_etb,
      status: "pending",
    });
    if (insErr) throw insErr;

    // Initialize Chapa transaction
    const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: String(plan.price_etb),
        currency: "ETB",
        email,
        first_name: firstName || "User",
        last_name: lastName,
        tx_ref,
        callback_url,
        return_url,
        ...(data.paymentMethod === "ebirr" ? { payment_method: "ebirr" } : {}),
        customization: {
          title: `${plan.name} plan`.slice(0, 16),
          description: `${plan.credits} credits`.slice(0, 50),
        },
      }),
    });

    const chapaJson = (await chapaRes.json()) as {
      status?: string;
      message?: string;
      data?: { checkout_url?: string };
    };

    if (!chapaRes.ok || chapaJson.status !== "success" || !chapaJson.data?.checkout_url) {
      // Mark payment failed
      await supabaseAdmin
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("tx_ref", tx_ref);
      throw new Error(`Chapa init failed: ${chapaJson.message ?? chapaRes.statusText}`);
    }

    const checkout_url = chapaJson.data.checkout_url;
    await supabaseAdmin
      .from("subscription_payments")
      .update({ checkout_url })
      .eq("tx_ref", tx_ref);

    return { checkout_url, tx_ref };
  });

// Verify a payment status (called from /payment/success page).
export const verifyChapaPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ tx_ref: z.string().min(1).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET) throw new Error("CHAPA_SECRET_KEY is not configured");

    const { data: payment, error } = await supabaseAdmin
      .from("subscription_payments")
      .select("*, plan:subscription_plans(*)")
      .eq("tx_ref", data.tx_ref)
      .maybeSingle();
    if (error) throw error;
    if (!payment || payment.user_id !== userId) {
      throw new Error("Payment not found");
    }

    if (payment.status === "success") {
      return { status: "success" as const, credits_awarded: payment.credits_awarded };
    }

    // Check Chapa
    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(data.tx_ref)}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } },
    );
    const verifyJson = (await verifyRes.json()) as {
      status?: string;
      data?: { status?: string; reference?: string };
    };

    if (verifyJson.status === "success" && verifyJson.data?.status === "success") {
      // Award credits atomically (re-check status to avoid double-award)
      const { data: fresh } = await supabaseAdmin
        .from("subscription_payments")
        .select("status")
        .eq("tx_ref", data.tx_ref)
        .maybeSingle();
      if (fresh?.status !== "success") {
        const planCredits = (payment as { plan: { credits: number } }).plan.credits;
        const { data: tokens } = await supabaseAdmin
          .from("user_tokens")
          .select("credits")
          .eq("user_id", userId)
          .maybeSingle();
        const newCredits = (tokens?.credits ?? 0) + planCredits;
        await supabaseAdmin
          .from("user_tokens")
          .update({ credits: newCredits, suspended: false })
          .eq("user_id", userId);
        await supabaseAdmin
          .from("subscription_payments")
          .update({
            status: "success",
            credits_awarded: planCredits,
            chapa_ref: verifyJson.data.reference ?? null,
          })
          .eq("tx_ref", data.tx_ref);
        return { status: "success" as const, credits_awarded: planCredits };
      }
      return { status: "success" as const, credits_awarded: payment.credits_awarded };
    }

    if (verifyJson.data?.status === "failed") {
      await supabaseAdmin
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("tx_ref", data.tx_ref);
      return { status: "failed" as const, credits_awarded: 0 };
    }

    return { status: "pending" as const, credits_awarded: 0 };
  });
