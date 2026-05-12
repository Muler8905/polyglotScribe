import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import am from "./locales/am.json";
import om from "./locales/om.json";
import so from "./locales/so.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "am", label: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "om", label: "Afaan Oromo", native: "Afaan Oromoo", flag: "🇪🇹" },
  { code: "so", label: "Somali", native: "Soomaali", flag: "🇸🇴" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        am: { translation: am },
        om: { translation: om },
        so: { translation: so },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "am", "om", "so"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "app_lang",
      },
    });
}

export default i18n;
