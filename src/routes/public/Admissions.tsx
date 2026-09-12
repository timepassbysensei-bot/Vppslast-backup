import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { AdmissionFormComponent } from "@/components/forms/AdmissionForm";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useSettings } from "@/hooks/public";

export function Admissions() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const open = settings?.admission_mode === "open";

  return (
    <PageShell title={t("nav.admissions")} path="/admissions">
      <div className="flex flex-col gap-4">
        <p className="text-ink/80">{t("fees.message")}</p>
        {open ? (
          <AdmissionFormComponent />
        ) : (
          <StatusMessage kind="info">{t("forms.admissionsClosed")}</StatusMessage>
        )}
      </div>
    </PageShell>
  );
}
