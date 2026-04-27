import { langLabel } from "@/lib/languages";

export async function translateText(text: string, targetLangCode: string, sourceLangCode?: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const target = langLabel(targetLangCode);
  const source = sourceLangCode ? langLabel(sourceLangCode) : "the detected source language";

  const sys = `You are a professional translator. Translate the user's text from ${source} into ${target}. Preserve meaning, tone, and formatting. Return ONLY the translated text — no preface, no quotes, no commentary.`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: text },
      ],
    }),
  });

  if (r.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
  if (r.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
  if (!r.ok) throw new Error(`Translation failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return (j.choices?.[0]?.message?.content ?? "").trim();
}
