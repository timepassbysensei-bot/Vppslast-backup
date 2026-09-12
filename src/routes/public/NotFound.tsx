import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <PageShell title="404" heading="404" noindex>
      <p className="text-ink/80 mb-4">This page could not be found.</p>
      <Link to="/" className="btn btn-primary">
        {t("nav.home")}
      </Link>
    </PageShell>
  );
}
