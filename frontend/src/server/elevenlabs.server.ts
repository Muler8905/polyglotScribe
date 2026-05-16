// Server-only ElevenLabs helpers
function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) {
    console.error("[ElevenLabs] ELEVENLABS_API_KEY is MISSING in process.env");
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }
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

export async function transcribeFile(file: Blob, languageCode?: string): Promise<{ text: string; language_code?: string }> {
  try {
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
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error("[ElevenLabs] API Error:", r.status, errorText);
      if (r.status === 401 || r.status === 429 || errorText.includes("Unusual activity detected") || errorText.includes("Free Tier")) {
        throw new Error(`ELEVENLABS_RATE_LIMIT: ${errorText}`);
      }
      throw new Error(`Transcription failed: ${r.status} ${errorText}`);
    }
    
    return await r.json();
  } catch (err: any) {
    if (err.message && err.message.includes("ELEVENLABS_RATE_LIMIT")) {
      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (openaiKey) {
        console.warn("ElevenLabs limited or blocked, falling back to OpenAI Whisper...");
        try {
          return await transcribeWithOpenAI(file, languageCode, openaiKey);
        } catch (openaiErr: any) {
          console.error("OpenAI fallback failed:", openaiErr.message);
          if (geminiKey) {
            console.warn("OpenAI failed, falling back to Google Gemini...");
            return await transcribeWithGemini(file, languageCode, geminiKey);
          }
          throw openaiErr;
        }
      } else if (geminiKey) {
        console.warn("ElevenLabs limited or blocked, falling back to Google Gemini...");
        return await transcribeWithGemini(file, languageCode, geminiKey);
      }
    }
    throw err;
  }
}

async function transcribeWithGemini(file: Blob, languageCode: string | undefined, apiKey: string) {
  const buffer = await file.arrayBuffer();
  // Gemini inline payload limit is 20MB
  if (buffer.byteLength > 19.5 * 1024 * 1024) {
     throw new Error("File is too large for Gemini API fallback (max ~20MB). Please use a shorter video or add an OpenAI API Key.");
  }
  const base64Data = Buffer.from(buffer).toString("base64");
  const mimeType = (file.type || "audio/webm").split(";")[0];

  const prompt = languageCode && languageCode !== "auto" 
    ? `Please transcribe the following audio exactly as spoken. The audio is in the language with code '${languageCode}'. Output ONLY the transcription, nothing else. Do not include commentary.`
    : `Please transcribe the following audio exactly as spoken in its original language. Output ONLY the transcription, nothing else. Do not include commentary.`;

  const trimmedKey = apiKey.trim();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${trimmedKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
      }
    }),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error("Gemini Transcription Error:", errText);
    throw new Error(`Fallback Transcription (Gemini) failed: ${r.status}. This usually happens when both ElevenLabs and Gemini are out of credits.`);
  }

  const j = await r.json();
  const text = (j.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  
  return { text, language_code: languageCode || "auto" };
}

async function transcribeWithOpenAI(file: Blob, languageCode: string | undefined, apiKey: string) {
  const fd = new FormData();
  // Whisper requires a filename with extension
  let fileObj = file;
  if (!(file instanceof File) || !file.name) {
    fileObj = new File([file], "audio.webm", { type: file.type || "audio/webm" });
  }
  
  fd.append("file", fileObj);
  fd.append("model", "whisper-1");
  if (languageCode && languageCode !== "auto") {
    fd.append("language", languageCode);
  }

  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: fd,
  });

  if (!r.ok) {
    throw new Error(`OpenAI Transcription failed: ${r.status} ${await r.text()}`);
  }

  const j = await r.json();
  return { text: j.text, language_code: languageCode || "auto" };
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
