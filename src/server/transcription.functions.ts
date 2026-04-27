import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createScribeRealtimeToken, ttsToBase64 } from "@/server/elevenlabs.server";
import { extractVideoId, fetchYouTubeTranscript } from "@/server/youtube.server";
import { translateText } from "@/server/translate.server";
import { LANGUAGES } from "@/lib/languages";

// 1) Live transcription token
export const getScribeToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const token = await createScribeRealtimeToken();
    return { token };
  });

// 2) YouTube transcription + save
export const transcribeYouTube = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string; preferredLang?: string }) => d)
  .handler(async ({ data, context }) => {
    const id = extractVideoId(data.url);
    if (!id) throw new Error("Invalid YouTube URL");
    const { title, text, languageCode } = await fetchYouTubeTranscript(id, data.preferredLang);

    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("transcriptions")
      .insert({
        user_id: userId,
        type: "youtube",
        title,
        source_url: `https://youtu.be/${id}`,
        source_lang: languageCode,
        transcript: text,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, title, text, languageCode };
  });

// 3) Translate + save translation onto a transcription
export const translateTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { transcriptionId: string; targetLang: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("transcriptions")
      .select("transcript, source_lang")
      .eq("id", data.transcriptionId)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Not found");

    const translated = await translateText(row.transcript, data.targetLang, row.source_lang ?? undefined);

    const { error: upErr } = await supabase
      .from("transcriptions")
      .update({ translation: translated, target_lang: data.targetLang })
      .eq("id", data.transcriptionId);
    if (upErr) throw new Error(upErr.message);

    return { translation: translated };
  });

// 4) Translate ad-hoc text (for live preview without saving yet)
export const translateAdhoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; targetLang: string; sourceLang?: string }) => d)
  .handler(async ({ data }) => {
    if (!data.text.trim()) return { translation: "" };
    const translation = await translateText(data.text, data.targetLang, data.sourceLang);
    return { translation };
  });

// 5) Save a transcription (for live recordings)
export const saveTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      type: "live" | "file" | "youtube";
      title: string;
      transcript: string;
      sourceLang?: string;
      targetLang?: string;
      translation?: string;
      sourceUrl?: string;
    }) => d
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("transcriptions")
      .insert({
        user_id: userId,
        type: data.type,
        title: data.title,
        transcript: data.transcript,
        source_lang: data.sourceLang ?? null,
        target_lang: data.targetLang ?? null,
        translation: data.translation ?? null,
        source_url: data.sourceUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

// 6) List history
export const listTranscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("transcriptions")
      .select("id, type, title, source_lang, target_lang, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

// 7) Get one
export const getTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

// 8) Delete
export const deleteTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("transcriptions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// 9) TTS — returns base64 mp3
export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; lang: string }) => d)
  .handler(async ({ data }) => {
    const lang = LANGUAGES.find((l) => l.code === data.lang) ?? LANGUAGES[0];
    const trimmed = data.text.slice(0, 4500);
    const audioBase64 = await ttsToBase64(trimmed, lang.elevenVoice);
    return { audioBase64 };
  });
