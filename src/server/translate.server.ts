import { langLabel } from "@/lib/languages";

export async function translateText(text: string, targetLangCode: string, sourceLangCode?: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const target = langLabel(targetLangCode);
  const source = sourceLangCode ? langLabel(sourceLangCode) : "the auto-detected source language";

  const sys = [
    `You are an expert professional translator specializing in English, Amharic (አማርኛ), Afaan Oromo, and Somali.`,
    `Translate the user's text from ${source} into ${target}.`,
    ``,
    `STRICT RULES:`,
    `1. Preserve the EXACT meaning, intent, nuance, tone, register, and emotion of the original.`,
    `2. Use natural, idiomatic ${target} as a fluent native speaker would write it — never word-for-word.`,
    `3. Keep proper nouns, brand names, code, numbers, URLs, emails, hashtags and @mentions unchanged.`,
    `4. Preserve punctuation, line breaks, lists and formatting exactly.`,
    `5. For Amharic output, use proper Ethiopic script (Fidel) with correct spelling and grammar.`,
    `6. For Afaan Oromo output, use the Qubee Latin alphabet with correct gemination and vowel length.`,
    `7. For Somali output, use standard Somali Latin orthography with correct doubled vowels and consonants.`,
    `8. If the source already matches the target language, return it unchanged.`,
    `9. Do NOT add explanations, transliterations, alternatives, quotes, or commentary.`,
    `10. Output ONLY the translated text — nothing else.`,
  ].join("\n");

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      temperature: 0.2,
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
