import { createServerFn } from "@tanstack/react-start";
import { requireApiAuth } from "@/integrations/api/auth-middleware";
import { createScribeRealtimeToken, ttsToBase64 } from "@/server/elevenlabs.server";
import { extractVideoId, fetchYouTubeTranscript, getYouTubeMetadata } from "@/server/youtube.server";
import { translateText } from "@/server/translate.server";
import { LANGUAGES } from "@/lib/languages";

const API_URL = process.env.API_URL || process.env.VITE_API_URL || (import.meta.env?.VITE_API_URL as string) || "http://localhost:5000/api";

function toClientItem(row: any) {
  // Backend returns Mongo/Mongoose docs (camelCase). UI expects legacy snake_case.
  return {
    id: row._id ?? row.id,
    type: row.type,
    title: row.title,
    source_url: row.sourceUrl ?? row.source_url ?? null,
    source_lang: row.sourceLang ?? row.source_lang ?? null,
    target_lang: row.targetLang ?? row.target_lang ?? null,
    transcript: row.transcript ?? "",
    translation: row.translation ?? null,
    created_at: row.createdAt ?? row.created_at ?? null,
  };
}

// 1) Live transcription token
export const getScribeToken = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(async () => {
    const token = await createScribeRealtimeToken();
    return { token };
  });

// 2) YouTube transcription + save
export const transcribeYouTube = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { url: string; preferredLang?: string }) => d)
  .handler(async ({ data, context }) => {
    const id = extractVideoId(data.url);
    if (!id) throw new Error("Invalid YouTube URL");
    const { title, text, languageCode } = await fetchYouTubeTranscript(id, data.preferredLang);

    const res = await fetch(`${API_URL}/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "youtube",
        title,
        sourceUrl: `https://youtu.be/${id}`,
        sourceLang: languageCode,
        transcript: text,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to save transcription");
    return { id: json.data.id, title, text, languageCode };
  });

// 3) Translate + save translation onto a transcription
export const translateTranscription = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { transcriptionId: string; targetLang: string }) => d)
  .handler(async ({ data, context }) => {
    const getRes = await fetch(`${API_URL}/transcriptions/${data.transcriptionId}`, {
      headers: { Authorization: `Bearer ${context.token}` },
    });
    const getJson = await getRes.json();
    if (!getRes.ok || !getJson?.data?.item) throw new Error(getJson?.message ?? "Not found");
    const row = getJson.data.item;

    const translated = await translateText(
      row.transcript,
      data.targetLang,
      row.sourceLang ?? row.source_lang ?? undefined,
    );

    const upRes = await fetch(`${API_URL}/transcriptions/${data.transcriptionId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ translation: translated, targetLang: data.targetLang }),
    });
    const upJson = await upRes.json();
    if (!upRes.ok || !upJson?.success) throw new Error(upJson?.message || "Failed to update translation");

    return { translation: translated };
  });

// 4) Translate ad-hoc text (for live preview without saving yet)
export const translateAdhoc = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { text: string; targetLang: string; sourceLang?: string }) => d)
  .handler(async ({ data }) => {
    if (!data.text.trim()) return { translation: "" };
    const translation = await translateText(data.text, data.targetLang, data.sourceLang);
    return { translation };
  });

// 5) Save a transcription (for live recordings)
export const saveTranscription = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator(
    (d: {
      type: "live" | "file" | "youtube";
      title: string;
      transcript: string;
      sourceLang?: string;
      targetLang?: string;
      translation?: string;
      sourceUrl?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Save failed");
    return { id: json.data.id };
  });

// 6) List history
export const listTranscriptions = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(async ({ context }) => {
    const res = await fetch(`${API_URL}/transcriptions`, {
      headers: { Authorization: `Bearer ${context.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
    return { items: (json.data?.items ?? []).map(toClientItem) };
  });

// 7) Get one
export const getTranscription = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/transcriptions/${data.id}`, {
      headers: { Authorization: `Bearer ${context.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
    return { item: toClientItem(json.data.item) };
  });

// 8) Delete
export const deleteTranscription = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const res = await fetch(`${API_URL}/transcriptions/${data.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${context.token}` },
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
    return { ok: true };
  });

// 9) TTS — returns base64 mp3
export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { text: string; lang: string }) => d)
  .handler(async ({ data }) => {
    const lang = LANGUAGES.find((l) => l.code === data.lang) ?? LANGUAGES[0];
    const trimmed = data.text.slice(0, 4500);
    const audioBase64 = await ttsToBase64(trimmed, lang.elevenVoice);
    return { audioBase64 };
  });

export const getYouTubeInfo = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((d: { url: string }) => d)
  .handler(async ({ data }) => {
    const id = extractVideoId(data.url);
    if (!id) throw new Error("Invalid YouTube URL");
    const meta = await getYouTubeMetadata(id);
    return { id, title: meta?.title, languageCode: meta?.languageCode };
  });
