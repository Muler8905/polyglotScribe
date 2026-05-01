// Server-only ElevenLabs helpers
function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not configured");
  return k;
}

export async function createScribeRealtimeToken(): Promise<string> {
  const r = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    { method: "POST", headers: { "xi-api-key": key() } }
  );
  if (!r.ok) throw new Error(`Token request failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.token as string;
}

export async function transcribeFile(file: Blob, languageCode?: string) {
  const fd = new FormData();
  fd.append("file", file);
  // Highest-accuracy ElevenLabs Scribe model
  fd.append("model_id", "scribe_v2");
  // Tag laughter / applause / music so transcripts read naturally
  fd.append("tag_audio_events", "true");
  // Speaker labels improve readability for multi-speaker audio
  fd.append("diarize", "true");
  // Word-level timestamps help downstream alignment / translation
  fd.append("timestamps_granularity", "word");
  if (languageCode && languageCode !== "auto") fd.append("language_code", languageCode);

  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: fd,
  });
  if (!r.ok) throw new Error(`Transcription failed: ${r.status} ${await r.text()}`);
  return r.json() as Promise<{ text: string; language_code?: string }>;
}

export async function ttsToBase64(text: string, voiceId: string) {
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key(), "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );
  if (!r.ok) throw new Error(`TTS failed: ${r.status} ${await r.text()}`);
  const buf = await r.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}
