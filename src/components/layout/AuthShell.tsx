import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-navy text-white">
        <div className="container-page flex items-center py-2">
          <Link to="/" className="font-bold text-white">
            {t("common.schoolName")}
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 grid place-items-center p-4 outline-none">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
