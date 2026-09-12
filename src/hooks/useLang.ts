import { useTranslation } from "react-i18next";
import type { Lang } from "@/lib/types";

export function useLang(): Lang {
  const { i18n } = useTranslation();
  return i18n.language.startsWith("hi") ? "hi" : "en";
}

export function setLang(lang: Lang): void {
  void import("@/i18n").then((m) => m.default.changeLanguage(lang));
}
