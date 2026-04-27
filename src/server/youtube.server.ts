// Fetch YouTube captions (no API key needed for public auto-captions via timedtext)
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

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string };
}

async function getPlayerResponse(videoId: string): Promise<any | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
  const res = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*(?:var|<\/script>)/s);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

async function fetchCaptionXml(baseUrl: string): Promise<string> {
  const res = await fetch(baseUrl);
  if (!res.ok) throw new Error(`Caption fetch failed: ${res.status}`);
  const xml = await res.text();
  // Extract <text ...>content</text>
  const matches = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
  return matches
    .map((m) => decodeXml(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}

async function fetchTimedTextList(videoId: string): Promise<CaptionTrack[]> {
  // Fallback: legacy timedtext list endpoint
  const res = await fetch(
    `https://video.google.com/timedtext?type=list&v=${videoId}`
  );
  if (!res.ok) return [];
  const xml = await res.text();
  const tracks: CaptionTrack[] = [];
  for (const m of xml.matchAll(/<track[^>]*lang_code="([^"]+)"[^>]*(?:kind="([^"]*)")?[^>]*\/>/g)) {
    const lang = m[1];
    const kind = m[2];
    const baseUrl = `https://video.google.com/timedtext?lang=${encodeURIComponent(lang)}&v=${videoId}${kind ? `&kind=${kind}` : ""}`;
    tracks.push({ baseUrl, languageCode: lang, kind });
  }
  return tracks;
}

export async function fetchYouTubeTranscript(videoId: string, preferredLang?: string) {
  const player = await getPlayerResponse(videoId);
  const title: string = player?.videoDetails?.title || `YouTube ${videoId}`;
  let tracks: CaptionTrack[] =
    player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (!tracks.length) {
    tracks = await fetchTimedTextList(videoId);
  }

  if (!tracks.length) {
    throw new Error(
      "No captions found. YouTube may be blocking caption access for this video, or it has none. Try a video with manually-added captions (look for the [CC] badge), or use the File or Live transcription mode instead."
    );
  }

  // Pick preferred language, then English, then first
  const pick =
    (preferredLang && tracks.find((t) => t.languageCode.startsWith(preferredLang))) ||
    tracks.find((t) => t.languageCode.startsWith("en")) ||
    tracks[0];

  let text = "";
  try {
    text = await fetchCaptionXml(pick.baseUrl);
  } catch {
    text = "";
  }

  if (!text.trim()) {
    throw new Error(
      "Captions exist but couldn't be downloaded (YouTube returned empty). Try another video, or use File/Live transcription."
    );
  }

  return { title, text, languageCode: pick.languageCode };
}
