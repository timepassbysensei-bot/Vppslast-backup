import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { EmergencyAlertBar } from "@/components/EmergencyAlertBar";
import { SenseiWidget } from "@/components/Sensei/SenseiWidget";

export function PublicLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="skip-link">
        {t("nav.skipToContent")}
      </a>
      <EmergencyAlertBar />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <SenseiWidget />
    </div>
  );
}
