// Extract audio from a YouTube video and transcribe it via ElevenLabs Scribe.
// Pure-JS approach: parse ytInitialPlayerResponse for an audio-only adaptive stream URL,
// fetch the audio bytes, and forward to ElevenLabs speech-to-text.
import { transcribeFile } from "@/server/elevenlabs.server";

export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts|v)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    if (/^[\w-]{11}$/.test(url)) return url;
  }
  return null;
}

interface AdaptiveFormat {
  itag: number;
  url?: string;
  signatureCipher?: string;
  cipher?: string;
  mimeType: string;
  bitrate: number;
  contentLength?: string;
  audioQuality?: string;
}

async function getPlayerResponse(videoId: string): Promise<any | null> {
  // Use the Android InnerTube client — returns plain audio URLs without
  // signature ciphers, which we cannot decrypt in a Worker.
  try {
    const r = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 14)",
        "X-YouTube-Client-Name": "3",
        "X-YouTube-Client-Version": "19.09.37",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 34,
            hl: "en",
            gl: "US",
          },
        },
      }),
    });
    if (r.ok) return await r.json();
  } catch {
    /* fall through */
  }
  return null;
}

function pickAudioFormat(player: any): AdaptiveFormat | null {
  const fmts: AdaptiveFormat[] =
    player?.streamingData?.adaptiveFormats ?? [];
  const audios = fmts
    .filter((f) => f.mimeType?.startsWith("audio/") && f.url && !f.signatureCipher && !f.cipher)
    .sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0)); // lowest bitrate first (smaller = faster)
  // Prefer the smallest decent-quality stream to keep payload small for Scribe
  return audios[0] ?? null;
}

export async function fetchYouTubeTranscript(videoId: string, preferredLang?: string) {
  const player = await getPlayerResponse(videoId);
  if (!player) throw new Error("Could not load video metadata from YouTube.");

  const playability = player.playabilityStatus?.status;
  if (playability && playability !== "OK") {
    throw new Error(
      `Video unavailable (${playability}): ${player.playabilityStatus?.reason ?? "unknown reason"}`
    );
  }

  const title: string = player.videoDetails?.title || `YouTube ${videoId}`;
  const lengthSec = parseInt(player.videoDetails?.lengthSeconds ?? "0", 10);
  if (lengthSec && lengthSec > 60 * 30) {
    throw new Error(
      `Video is too long (${Math.round(lengthSec / 60)} min). Please use a video under 30 minutes.`
    );
  }

  const fmt = pickAudioFormat(player);
  if (!fmt?.url) {
    throw new Error(
      "Could not extract an audio stream from this video. It may be age-restricted, private, or region-blocked."
    );
  }

  // Cap at ~40MB to stay within reasonable upload limits
  const contentLength = parseInt(fmt.contentLength ?? "0", 10);
  if (contentLength && contentLength > 40 * 1024 * 1024) {
    throw new Error(
      `Audio stream is too large (${Math.round(contentLength / 1024 / 1024)}MB). Please use a shorter video.`
    );
  }

  const audioRes = await fetch(fmt.url);
  if (!audioRes.ok) {
    throw new Error(`Failed to download audio: ${audioRes.status}`);
  }
  const audioBuf = await audioRes.arrayBuffer();

  // Derive extension from mimeType (e.g. audio/mp4 -> m4a, audio/webm -> webm)
  const mime = fmt.mimeType.split(";")[0];
  const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "m4a" : "audio";
  const blob = new Blob([audioBuf], { type: mime });
  // Wrap as File-like for FormData filename
  const file = new File([blob], `${videoId}.${ext}`, { type: mime });

  const result = await transcribeFile(file, preferredLang && preferredLang !== "auto" ? preferredLang : undefined);

  return {
    title,
    text: result.text,
    languageCode: result.language_code ?? preferredLang ?? "auto",
  };
}
