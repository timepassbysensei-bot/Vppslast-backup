import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { ClassContent } from "@/components/ClassContent";

export function ClassNotices() {
  const { t } = useTranslation();
  return (
    <PageShell title={t("classView.title")} heading={t("classView.title")} path="/class-notices">
      <p className="text-ink/70 mb-4">{t("classView.choose")}</p>
      <ClassContent mode="both" />
    </PageShell>
  );
}
