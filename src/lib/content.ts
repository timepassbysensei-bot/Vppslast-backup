import type { Lang } from "./types";

export type BilingualResult = { value: string; missingHi: boolean };

// Bilingual fallback rule: in Hindi, show Hindi when present; otherwise fall
// back to English and flag that a Hindi translation is unavailable. We never
// machine-translate admin content silently.
export function pickText(en: string | null | undefined, hi: string | null | undefined, lang: Lang): BilingualResult {
  const enVal = (en ?? "").trim();
  const hiVal = (hi ?? "").trim();
  if (lang === "hi") {
    if (hiVal) return { value: hiVal, missingHi: false };
    return { value: enVal, missingHi: enVal.length > 0 };
  }
  return { value: enVal, missingHi: false };
}
