import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

type Props = {
  en: string | null | undefined;
  hi: string | null | undefined;
  className?: string;
  as?: "span" | "p" | "div" | "h2" | "h3";
  showFallbackNote?: boolean;
};

// Renders bilingual content with the Hindi-fallback rule and an accessible
// "translation not available" note when applicable.
export function Bilingual({ en, hi, className, as = "span", showFallbackNote = true }: Props) {
  const { t } = useTranslation();
  const lang = useLang();
  const { value, missingHi } = pickText(en, hi, lang);
  const Tag = as;
  return (
    <>
      <Tag className={className}>{value}</Tag>
      {missingHi && showFallbackNote ? (
        <span className="block text-xs italic text-ink/50 mt-0.5">{t("common.translationUnavailable")}</span>
      ) : null}
    </>
  );
}
