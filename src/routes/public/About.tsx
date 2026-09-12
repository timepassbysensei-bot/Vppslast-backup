import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { Bilingual } from "@/components/Bilingual";
import { useSettings, useBranding } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

function Block({ title, en, hi }: { title: string; en: string | null | undefined; hi: string | null | undefined }) {
  const lang = useLang();
  if (!pickText(en, hi, lang).value) return null;
  return (
    <section className="card p-4">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <Bilingual as="p" en={en} hi={hi} className="text-ink/80 whitespace-pre-line" />
    </section>
  );
}

export function About() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const { data: branding } = useBranding();

  const anyContent =
    pickText(settings?.about_en, settings?.about_hi, lang).value ||
    pickText(settings?.mission_en, settings?.mission_hi, lang).value ||
    pickText(settings?.vision_en, settings?.vision_hi, lang).value;

  return (
    <PageShell title={t("nav.about")} path="/about">
      <div className="flex flex-col gap-4">
        {branding?.about_photo?.public_url ? (
          <img
            src={branding.about_photo.public_url}
            alt={pickText(branding.about_photo.alt_en, branding.about_photo.alt_hi, lang).value || t("nav.about")}
            className="w-full max-h-72 object-cover rounded-card"
          />
        ) : null}

        <Block title={t("nav.about")} en={settings?.about_en} hi={settings?.about_hi} />
        <Block title="Mission" en={settings?.mission_en} hi={settings?.mission_hi} />
        <Block title="Vision" en={settings?.vision_en} hi={settings?.vision_hi} />
        <Block title={t("home.principalMessage")} en={settings?.principal_message_en} hi={settings?.principal_message_hi} />

        {settings?.affiliation_en || settings?.affiliation_number || settings?.established_year ? (
          <section className="card p-4">
            <h2 className="text-lg font-bold mb-2">{t("nav.about")}</h2>
            <ul className="text-ink/80 space-y-1">
              {settings?.established_year ? <li>Established: {settings.established_year}</li> : null}
              {settings?.affiliation_en ? (
                <li>
                  Affiliation: {pickText(settings.affiliation_en, settings.affiliation_hi, lang).value}
                </li>
              ) : null}
              {settings?.affiliation_number ? <li>Affiliation No.: {settings.affiliation_number}</li> : null}
            </ul>
          </section>
        ) : null}

        {!anyContent ? <p className="text-ink/60">{t("home.principalMessagePending")}</p> : null}

        <p className="text-sm text-ink/70">{t("fees.message")}</p>
      </div>
    </PageShell>
  );
}
