import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { ClassContent } from "@/components/ClassContent";

export function HomeworkPage() {
  const { t } = useTranslation();
  return (
    <PageShell title={t("nav.homework")} path="/homework">
      <p className="text-ink/70 mb-4">{t("classView.choose")}</p>
      <ClassContent mode="homework" />
    </PageShell>
  );
}
