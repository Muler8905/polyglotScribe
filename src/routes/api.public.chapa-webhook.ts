import { createFileRoute } from "@tanstack/react-router";
const API_URL = process.env.API_URL || process.env.VITE_API_URL || "http://localhost:5000/api";

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
  const res = await fetch(`${API_URL}/public/chapa?tx_ref=${encodeURIComponent(tx_ref)}`);
  if (!res.ok) return new Response("proxy failed", { status: 500 });
  return new Response("ok", { status: 200 });
}
