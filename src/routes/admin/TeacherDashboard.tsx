import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/layout/AdminShell";
import { Tabs, type TabDef } from "@/components/ui/Tabs";
import { Seo } from "@/components/Seo";
import { HomeworkManager } from "@/components/teacher/HomeworkManager";
import { ClassNoticeManager } from "@/components/teacher/ClassNoticeManager";
import { PrincipalBoard } from "@/components/teacher/PrincipalBoard";
import { LeaveCenter } from "@/components/teacher/LeaveCenter";
import { BirthdayManager } from "@/components/teacher/BirthdayManager";
import { SpotlightManager } from "@/components/teacher/SpotlightManager";
import { useAuth } from "@/providers/AuthProvider";

export function TeacherDashboard() {
  const { t } = useTranslation();
  const { isPrincipal } = useAuth();

  const tabs: TabDef[] = [
    { id: "homework", label: t("teacher.homeworkUploader"), node: <HomeworkManager /> },
    { id: "notices", label: t("teacher.classNotices"), node: <ClassNoticeManager /> },
    { id: "board", label: t("teacher.principalBoard"), node: <PrincipalBoard /> },
    { id: "leave", label: t("teacher.leaveCenter"), node: <LeaveCenter /> },
    { id: "birthdays", label: t("teacher.birthdays"), node: <BirthdayManager /> },
    { id: "spotlight", label: t("teacher.spotlight"), node: <SpotlightManager /> },
  ];

  return (
    <AdminShell title={t("teacher.title")}>
      <Seo title={t("teacher.title")} noindex path="/admin/teacher" />
      {isPrincipal ? (
        <div className="mb-4">
          <Link to="/admin/principal" className="btn btn-amber">
            {t("principal.title")}
          </Link>
        </div>
      ) : null}
      <p className="text-sm text-ink/60 mb-3">{t("teacher.onlyOwnDelete")}</p>
      <Tabs tabs={tabs} />
    </AdminShell>
  );
}
