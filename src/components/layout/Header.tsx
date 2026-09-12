import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useSettings, useBranding } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const { t } = useTranslation();
  const lang = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: settings } = useSettings();
  const { data: branding } = useBranding();

  const nameEn = settings?.name_en || t("common.schoolName");
  const nameHi = settings?.name_hi ?? null;
  const displayName = pickText(nameEn, nameHi, lang).value || nameEn;
  const logo = branding?.logo;

  return (
    <header className="bg-bg border-b border-ink/10 sticky top-0 z-40">
      <div className="container-page flex items-center gap-3 py-2">
        <Link to="/" className="flex items-center gap-2 min-h-touch" aria-label={displayName}>
          {logo?.public_url ? (
            <img src={logo.public_url} alt="" className="h-10 w-10 object-contain" width={40} height={40} />
          ) : (
            <img src="/favicon.svg" alt="" className="h-10 w-10" width={40} height={40} />
          )}
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-navy text-sm sm:text-base">{displayName}</span>
            {lang === "en" && nameHi ? <span className="text-xs text-ink/60">{nameHi}</span> : null}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block ml-auto">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `px-2.5 py-2 rounded-card text-sm inline-block ${isActive ? "bg-navy text-white" : "hover:bg-surface"}`
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/admin/login" className="btn btn-primary px-3 py-1 text-sm">
            {t("nav.teacherLogin")}
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2 ml-auto">
          <LanguageSwitcher />
          <button
            type="button"
            className="btn btn-outline p-2"
            aria-label={t("nav.openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
