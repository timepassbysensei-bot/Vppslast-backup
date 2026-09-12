import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import hi from "./hi.json";

export const SUPPORTED_LANGS = ["en", "hi"] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "vpps_lang",
      caches: ["localStorage"],
    },
  });

// Keep <html lang> in sync so :lang(hi) font rules and screen readers work.
function syncHtmlLang(lng: string): void {
  const base = lng.startsWith("hi") ? "hi" : "en";
  document.documentElement.setAttribute("lang", base);
}
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
