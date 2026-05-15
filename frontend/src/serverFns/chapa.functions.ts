import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireApiAuth } from "@/integrations/api/auth-middleware";

const API_URL = process.env.API_URL || process.env.VITE_API_URL || (import.meta.env?.VITE_API_URL as string) || "http://localhost:5000/api";

export const initiateChapaPayment = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input) =>
    z
      .object({
        planSlug: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/billing/payments/initiate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planSlug: data.planSlug }),
    });
    const json = await res.json().catch(() => ({ success: false, message: `Invalid JSON from ${res.url} (Status ${res.status})` }));
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `API Error ${res.status} from ${API_URL}`);
    }
    const url = json.data?.checkoutUrl || json.data?.checkout_url;
    if (!url) {
      throw new Error(`Backend succeeded but no checkoutUrl was provided by ${API_URL}`);
    }
    return { checkout_url: url, tx_ref: json.data.txRef, debug_url: API_URL };
  });

export const initiateEbirrPayment = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input) =>
    z
      .object({
        planSlug: z.string().min(1).max(64),
        mobile: z
          .string()
          .trim()
          .regex(/^(09|07)\d{8}$/, "Phone must be 10 digits starting with 09 or 07"),
        type: z.enum(["telebirr", "ebirr", "cbebirr", "mpesa"]).optional().default("telebirr"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/billing/payments/initiate-ebirr`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        planSlug: data.planSlug,
        mobile: data.mobile,
        type: data.type
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to initiate e-Birr payment");
    return { tx_ref: json.data.txRef, message: json.data.message };
  });

export const verifyChapaPayment = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input) => z.object({ tx_ref: z.string().min(1).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/billing/payments/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txRef: data.tx_ref }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Verification failed");
    return {
      status: json.data.status as "success" | "pending" | "failed",
      credits_awarded: json.data.creditsAwarded ?? 0,
    };
  });

export const verifyEbirrPayment = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input) => z.object({ tx_ref: z.string().min(1).max(128) }).parse(input))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/billing/payments/verify-ebirr`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txRef: data.tx_ref }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Verification failed");
    return {
      status: json.data.status as "success" | "pending" | "failed",
      credits_awarded: json.data.creditsAwarded ?? 0,
    };
  });

export const deletePaymentHistory = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/billing/payments/${data.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${context.token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to delete payment history");
    return { success: true };
  });
