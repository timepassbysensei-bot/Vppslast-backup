import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ParentMessageFormComponent } from "@/components/forms/ParentMessageForm";
import { useSettings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

export function Contact() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const address = pickText(settings?.address_en, settings?.address_hi, lang).value;
  const officeHours = pickText(settings?.office_hours_en, settings?.office_hours_hi, lang).value;

  return (
    <PageShell title={t("nav.contact")} path="/contact">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h2 className="text-lg font-bold mb-2">{t("home.contact")}</h2>
            <ul className="space-y-2 text-ink/80">
              {settings?.phone ? (
                <li className="flex items-center gap-2">
                  <Phone size={18} aria-hidden="true" className="text-navy" />
                  <a className="hover:underline" href={`tel:${settings.phone}`}>
                    {settings.phone}
                  </a>
                </li>
              ) : null}
              {settings?.email ? (
                <li className="flex items-center gap-2">
                  <Mail size={18} aria-hidden="true" className="text-navy" />
                  <a className="hover:underline" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </li>
              ) : null}
              {address ? (
                <li className="flex items-start gap-2">
                  <MapPin size={18} aria-hidden="true" className="text-navy mt-0.5" />
                  <span>{address}</span>
                </li>
              ) : null}
              {officeHours ? <li className="text-sm text-ink/70">{officeHours}</li> : null}
            </ul>
            <p className="text-sm text-ink/70 mt-3">{t("fees.message")}</p>
          </div>

          {settings?.map_url ? (
            <div className="card p-2 overflow-hidden">
              <a href={settings.map_url} target="_blank" rel="noopener noreferrer" className="text-navy-600 underline">
                {t("nav.contact")} — Map
              </a>
            </div>
          ) : null}
        </div>

        <ParentMessageFormComponent />
      </div>
    </PageShell>
  );
}
