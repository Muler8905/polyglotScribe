import { createFileRoute } from "@tanstack/react-router";
import { transcribeFile } from "@/server/elevenlabs.server";
const API_URL = process.env.API_URL || process.env.VITE_API_URL || "http://localhost:5000/api";

async function getAccessToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export const Route = createFileRoute("/api/transcribe-file")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = await getAccessToken(request);
        if (!token) return new Response("Unauthorized", { status: 401 });

        const form = await request.formData();
        const file = form.get("file");
        const lang = (form.get("language_code") as string | null) ?? undefined;
        const title = ((form.get("title") as string | null) ?? "Audio file").slice(0, 200);
        if (!(file instanceof Blob)) {
          return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 });
        }

        try {
          const result = await transcribeFile(file, lang);
          const saveRes = await fetch(`${API_URL}/transcriptions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "file",
              title,
              sourceLang: result.language_code ?? lang ?? null,
              transcript: result.text,
            }),
          });
          const saveJson = await saveRes.json();
          if (!saveRes.ok || !saveJson?.success) throw new Error(saveJson?.message || "Failed to save");

          return Response.json({
            id: saveJson.data.id,
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
