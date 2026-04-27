import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { transcribeFile } from "@/server/elevenlabs.server";

async function getUserClient(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export const Route = createFileRoute("/api/transcribe-file")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await getUserClient(request);
        if (!ctx) return new Response("Unauthorized", { status: 401 });

        const form = await request.formData();
        const file = form.get("file");
        const lang = (form.get("language_code") as string | null) ?? undefined;
        const title = ((form.get("title") as string | null) ?? "Audio file").slice(0, 200);
        if (!(file instanceof Blob)) {
          return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 });
        }

        try {
          const result = await transcribeFile(file, lang);
          const { data, error } = await ctx.supabase
            .from("transcriptions")
            .insert({
              user_id: ctx.userId,
              type: "file",
              title,
              source_lang: result.language_code ?? lang ?? null,
              transcript: result.text,
            })
            .select()
            .single();
          if (error) throw error;

          return Response.json({
            id: data.id,
            text: result.text,
            languageCode: result.language_code ?? lang ?? null,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Transcription failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
