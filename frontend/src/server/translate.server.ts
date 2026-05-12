import { langLabel } from "@/lib/languages";

export async function translateText(text: string, targetLangCode: string, sourceLangCode?: string) {
  // Support multiple translation providers
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (geminiKey) {
    try {
      return await translateWithGemini(text, targetLangCode, sourceLangCode, geminiKey);
    } catch (error: any) {
      if (error.message && error.message.includes("Rate limit exceeded") && openaiKey) {
        console.warn("Gemini rate limited, falling back to OpenAI...");
        return await translateWithOpenAI(text, targetLangCode, sourceLangCode, openaiKey);
      }
      throw error;
    }
  } else if (openaiKey) {
    return await translateWithOpenAI(text, targetLangCode, sourceLangCode, openaiKey);
  } else {
    throw new Error("Translation API key not configured. Please set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY in your .env file");
  }
}

async function translateWithGemini(text: string, targetLangCode: string, sourceLangCode: string | undefined, apiKey: string) {
  const target = langLabel(targetLangCode);
  const source = sourceLangCode ? langLabel(sourceLangCode) : "the auto-detected source language";

  const prompt = [
    `You are an expert professional translator specializing in English, Amharic (አማርኛ), Afaan Oromo, and Somali.`,
    `Translate the following text from ${source} into ${target}.`,
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
    ``,
    `Text to translate:`,
    text,
  ].join("\n");

  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (r.status === 429) {
      retries--;
      if (retries === 0) throw new Error("Rate limit exceeded. Please try again shortly.");
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }

    if (!r.ok) throw new Error(`Translation failed: ${r.status} ${await r.text()}`);
    
    const j = await r.json();
    return (j.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  }
}

async function translateWithOpenAI(text: string, targetLangCode: string, sourceLangCode: string | undefined, apiKey: string) {
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

  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: text },
        ],
      }),
    });

    if (r.status === 429) {
      retries--;
      if (retries === 0) throw new Error("Rate limit exceeded. Please try again shortly.");
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }

    if (!r.ok) throw new Error(`Translation failed: ${r.status} ${await r.text()}`);
    
    const j = await r.json();
    return (j.choices?.[0]?.message?.content ?? "").trim();
  }
}
