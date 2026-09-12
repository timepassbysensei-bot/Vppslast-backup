import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { TimingsToday } from "@/components/TimingsToday";
import { Bilingual } from "@/components/Bilingual";
import { useClasses, useSettings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

export function Academics() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: classData } = useClasses();
  const { data: settings } = useSettings();
  const classes = classData?.classes ?? [];

  return (
    <PageShell title={t("nav.academics")} path="/academics">
      <div className="flex flex-col gap-6">
        {pickText(settings?.intro_en, settings?.intro_hi, lang).value ? (
          <div className="card p-4">
            <Bilingual as="p" en={settings?.intro_en} hi={settings?.intro_hi} className="text-ink/80" />
          </div>
        ) : null}

        <section aria-labelledby="classes-heading">
          <h2 id="classes-heading" className="text-xl font-bold mb-3">
            {t("common.allClasses")}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {classes.map((c) => (
              <li key={c.code} className="card p-3 text-center font-semibold text-navy">
                {pickText(c.name_en, c.name_hi, lang).value}
              </li>
            ))}
          </ul>
        </section>

        <TimingsToday />

        <p className="text-sm text-ink/70">{t("fees.message")}</p>
      </div>
    </PageShell>
  );
}
