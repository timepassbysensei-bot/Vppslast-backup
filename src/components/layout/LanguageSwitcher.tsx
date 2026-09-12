import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { useLang, setLang } from "@/hooks/useLang";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const lang = useLang();
  const next = lang === "en" ? "hi" : "en";
  return (
    <button
      type="button"
      className="btn btn-outline px-3 py-1"
      onClick={() => setLang(next)}
      aria-label={`Switch language to ${next === "hi" ? "हिन्दी" : "English"}`}
    >
      <Languages aria-hidden="true" size={18} />
      <span>{next === "hi" ? "हिन्दी" : "EN"}</span>
      <span className="visually-hidden">{t("common.languageName")}</span>
    </button>
  );
}
