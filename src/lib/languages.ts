export const LANGUAGES = [
  { code: "eng", label: "English", bcp47: "en", elevenVoice: "EXAVITQu4vr4xnSDxMaL" },
  { code: "amh", label: "Amharic", bcp47: "am", elevenVoice: "EXAVITQu4vr4xnSDxMaL" },
  { code: "orm", label: "Afaan Oromo", bcp47: "om", elevenVoice: "EXAVITQu4vr4xnSDxMaL" },
  { code: "som", label: "Somali", bcp47: "so", elevenVoice: "EXAVITQu4vr4xnSDxMaL" },
] as const;

export type LangCode = typeof LANGUAGES[number]["code"];

export function langLabel(code?: string | null) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code ?? "Auto";
}
