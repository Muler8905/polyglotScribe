// Extract audio from a YouTube video and transcribe it via ElevenLabs Scribe.
// The most reliable source of direct audio stream URLs is currently the mobile
// watch page's ytInitialPlayerResponse, so we parse that first and only fall
// back to other metadata sources when needed.
import { transcribeFile } from "@/server/elevenlabs.server";

const DESKTOP_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IOS_APP_UA = "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 17_0 like Mac OS X)";

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

function extractInitialPlayerResponse(html: string): any | null {
  const patterns = [
    /var ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/,
    /ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\});/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    try {
      return JSON.parse(match[1]);
    } catch {
      // keep trying the next extraction pattern
    }
  }

  return null;
}

function extractInnertubeApiKey(html: string): string | null {
  return html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] ?? null;
}

async function getIOSPlayerResponse(videoId: string): Promise<any | null> {
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent": DESKTOP_UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!watchRes.ok) return null;

    const html = await watchRes.text();
    const apiKey = extractInnertubeApiKey(html);
    if (!apiKey) return null;

    const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": IOS_APP_UA,
      },
      body: JSON.stringify({
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
        context: {
          client: {
            clientName: "IOS",
            clientVersion: "20.10.4",
            deviceModel: "iPhone16,2",
            hl: "en",
            gl: "US",
            osName: "iPhone",
            osVersion: "17.0.0.0.0",
            platform: "MOBILE",
          },
        },
      }),
    });

    if (!playerRes.ok) return null;
    return await playerRes.json();
  } catch {
    return null;
  }
}

async function getWatchPagePlayerResponse(videoId: string, mobile = true): Promise<any | null> {
  const base = mobile ? "https://m.youtube.com/watch" : "https://www.youtube.com/watch";
  try {
    const r = await fetch(`${base}?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent": mobile ? MOBILE_UA : DESKTOP_UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!r.ok) return null;
    return extractInitialPlayerResponse(await r.text());
  } catch {
    /* fall through */
  }
  return null;
}

async function getPlayerResponse(videoId: string): Promise<any | null> {
  return (
    (await getIOSPlayerResponse(videoId)) ??
    (await getWatchPagePlayerResponse(videoId, true)) ??
    (await getWatchPagePlayerResponse(videoId, false))
  );
}

function pickAudioFormat(player: any): AdaptiveFormat | null {
  const fmts: AdaptiveFormat[] =
    player?.streamingData?.adaptiveFormats ?? [];
  const audios = fmts
    .filter(
      (f: AdaptiveFormat & { drmFamilies?: string[] }) =>
        f.mimeType?.startsWith("audio/") &&
        f.url &&
        !f.signatureCipher &&
        !f.cipher &&
        !(f.drmFamilies?.length)
    )
    .sort((a, b) => (a.bitrate ?? 0) - (b.bitrate ?? 0)); // lowest bitrate first (smaller = faster)
  // Prefer the smallest decent-quality stream to keep payload small for Scribe
  return audios[0] ?? null;
}

async function fetchAudioResponse(url: string, videoId: string): Promise<Response> {
  const attempts: RequestInit[] = [
    {},
    { headers: { "User-Agent": IOS_APP_UA, Referer: `https://www.youtube.com/watch?v=${videoId}` } },
    { headers: { "User-Agent": MOBILE_UA, Referer: `https://m.youtube.com/watch?v=${videoId}` } },
    { headers: { "User-Agent": DESKTOP_UA, Referer: `https://www.youtube.com/watch?v=${videoId}` } },
  ];

  let lastResponse: Response | null = null;
  for (const init of attempts) {
    const response = await fetch(url, init);
    if (response.ok) return response;
    lastResponse = response;
  }

  throw new Error(
    `Failed to download YouTube audio (${lastResponse?.status ?? "unknown"}). This video may require protected playback.`
  );
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
      "Could not extract a downloadable audio stream from this video. It may be protected, private, age-restricted, or region-blocked."
    );
  }

  // Cap at ~40MB to stay within reasonable upload limits
  const contentLength = parseInt(fmt.contentLength ?? "0", 10);
  if (contentLength && contentLength > 40 * 1024 * 1024) {
    throw new Error(
      `Audio stream is too large (${Math.round(contentLength / 1024 / 1024)}MB). Please use a shorter video.`
    );
  }

  const audioRes = await fetchAudioResponse(fmt.url, videoId);
  const audioBuf = await audioRes.arrayBuffer();
  if (audioBuf.byteLength > 40 * 1024 * 1024) {
    throw new Error(
      `Audio stream is too large (${Math.round(audioBuf.byteLength / 1024 / 1024)}MB). Please use a shorter video.`
    );
  }

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
