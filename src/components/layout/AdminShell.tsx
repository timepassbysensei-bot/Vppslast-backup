import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-navy text-white">
        <div className="container-page flex items-center gap-3 py-2">
          <Link to="/" className="font-bold text-white">
            {t("common.schoolName")}
          </Link>
          <span className="ml-auto text-sm text-white/80 hidden sm:inline truncate max-w-[40%]">{user?.email}</span>
          <LanguageSwitcher />
          <button type="button" className="btn btn-amber px-3 py-1 text-sm" onClick={() => void signOut()}>
            <LogOut aria-hidden="true" size={16} />
            {t("common.signOut")}
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="container-page py-4">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
