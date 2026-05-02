import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Chapa sends a callback (POST or GET) to this URL after a transaction.
// The body contains tx_ref and status. We verify by calling the Chapa
// verify endpoint with our secret key — never trust the webhook body alone.
export const Route = createFileRoute("/api/public/chapa-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
  if (!CHAPA_SECRET) return new Response("not configured", { status: 500 });

  let tx_ref: string | null = null;
  try {
    if (request.method === "POST") {
      const ct = request.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const body = (await request.json()) as { tx_ref?: string; trx_ref?: string };
        tx_ref = body.tx_ref ?? body.trx_ref ?? null;
      } else {
        const fd = await request.formData();
        tx_ref = (fd.get("tx_ref") ?? fd.get("trx_ref"))?.toString() ?? null;
      }
    } else {
      const url = new URL(request.url);
      tx_ref = url.searchParams.get("tx_ref") ?? url.searchParams.get("trx_ref");
    }
  } catch {
    /* ignore parse errors */
  }

  if (!tx_ref) return new Response("missing tx_ref", { status: 400 });

  const { data: payment } = await supabaseAdmin
    .from("subscription_payments")
    .select("*, plan:subscription_plans(*)")
    .eq("tx_ref", tx_ref)
    .maybeSingle();

  if (!payment) return new Response("unknown tx_ref", { status: 404 });
  if (payment.status === "success") return new Response("already processed", { status: 200 });

  const verifyRes = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
    { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } },
  );
  const verifyJson = (await verifyRes.json()) as {
    status?: string;
    data?: { status?: string; reference?: string };
  };

  if (verifyJson.status !== "success" || verifyJson.data?.status !== "success") {
    return new Response("not verified", { status: 200 });
  }

  const planCredits = (payment as { plan: { credits: number } }).plan.credits;
  const { data: tokens } = await supabaseAdmin
    .from("user_tokens")
    .select("credits")
    .eq("user_id", payment.user_id)
    .maybeSingle();
  const newCredits = (tokens?.credits ?? 0) + planCredits;

  await supabaseAdmin
    .from("user_tokens")
    .update({ credits: newCredits, suspended: false })
    .eq("user_id", payment.user_id);
  await supabaseAdmin
    .from("subscription_payments")
    .update({
      status: "success",
      credits_awarded: planCredits,
      chapa_ref: verifyJson.data.reference ?? null,
    })
    .eq("tx_ref", tx_ref);

  return new Response("ok", { status: 200 });
}
