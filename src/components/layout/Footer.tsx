import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin } from "lucide-react";
import { NAV_ITEMS, LEGAL_ITEMS } from "@/lib/nav";
import { useSettings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

export function Footer() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const name = pickText(settings?.name_en ?? t("common.schoolName"), settings?.name_hi, lang).value;
  const address = pickText(settings?.address_en, settings?.address_hi, lang).value;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white mt-10">
      <div className="container-page py-8 grid gap-6 sm:grid-cols-3">
        <div>
          <h2 className="font-bold text-white mb-2">{name}</h2>
          <p className="text-white/80 text-sm">{t("fees.message")}</p>
        </div>

        <nav aria-label={t("footer.quickLinks")}>
          <h2 className="font-semibold text-white mb-2">{t("footer.quickLinks")}</h2>
          <ul className="grid grid-cols-2 gap-1 text-sm">
            {NAV_ITEMS.slice(1, 11).map((item) => (
              <li key={item.to}>
                <Link className="text-white/85 hover:text-white" to={item.to}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-semibold text-white mb-2">{t("footer.contact")}</h2>
          <ul className="text-sm space-y-1 text-white/85">
            {address ? (
              <li className="flex items-start gap-2">
                <MapPin size={16} aria-hidden="true" className="mt-0.5" />
                <span>{address}</span>
              </li>
            ) : null}
            {settings?.phone ? (
              <li className="flex items-center gap-2">
                <Phone size={16} aria-hidden="true" />
                <a className="hover:underline" href={`tel:${settings.phone}`}>
                  {settings.phone}
                </a>
              </li>
            ) : null}
            {settings?.email ? (
              <li className="flex items-center gap-2">
                <Mail size={16} aria-hidden="true" />
                <a className="hover:underline" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
            ) : null}
          </ul>
          <nav aria-label={t("footer.legal")} className="mt-3">
            <ul className="flex flex-wrap gap-3 text-xs text-white/70">
              {LEGAL_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link className="hover:text-white" to={item.to}>
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-page py-3 text-center text-xs text-white/70">
          © {year} {name}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
