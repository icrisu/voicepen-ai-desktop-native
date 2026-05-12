import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLanguage } from "./storage";

import en from "../locales/en.json";
import ar from "../locales/ar.json";
import fr from "../locales/fr.json";

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

export async function initI18n(): Promise<void> {
  const lang = await getLanguage();

  document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  document.documentElement.lang = lang;

  await i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
    },
  });
}

export function applyDirection(lang: string): void {
  document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export { RTL_LANGS };
