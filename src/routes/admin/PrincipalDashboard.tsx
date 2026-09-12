import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/layout/AdminShell";
import { Tabs, type TabDef } from "@/components/ui/Tabs";
import { Seo } from "@/components/Seo";
import { PendingRegistrations } from "@/components/principal/PendingRegistrations";
import { StaffRoster } from "@/components/principal/StaffRoster";
import { InternalNoticesManager } from "@/components/principal/InternalNoticesManager";
import { PublicNoticesManager } from "@/components/principal/PublicNoticesManager";
import { AllClassNotices } from "@/components/principal/AllClassNotices";
import { AllHomework } from "@/components/principal/AllHomework";
import { LeaveInbox } from "@/components/principal/LeaveInbox";
import { TimingManager } from "@/components/principal/TimingManager";
import { EmergencyAlertManager } from "@/components/principal/EmergencyAlertManager";
import { SettingsManager } from "@/components/principal/SettingsManager";
import { GalleryManager } from "@/components/principal/GalleryManager";
import { ResourcesManager } from "@/components/principal/ResourcesManager";
import { ParentMessagesManager, AdmissionsManager } from "@/components/principal/MessagesManager";
import { CalendarManager } from "@/components/principal/CalendarManager";
import { AchievementsManager } from "@/components/principal/AchievementsManager";
import { FaqManager } from "@/components/principal/FaqManager";
import { AuditViewer } from "@/components/principal/AuditViewer";

export function PrincipalDashboard() {
  const { t } = useTranslation();

  const tabs: TabDef[] = [
    { id: "pending", label: t("principal.pending"), node: <PendingRegistrations /> },
    { id: "roster", label: t("principal.roster"), node: <StaffRoster /> },
    { id: "internal", label: t("principal.internalNotices"), node: <InternalNoticesManager /> },
    { id: "public", label: t("principal.publicNotices"), node: <PublicNoticesManager /> },
    { id: "classnotices", label: t("principal.allClassNotices"), node: <AllClassNotices /> },
    { id: "homework", label: t("principal.allHomework"), node: <AllHomework /> },
    { id: "leave", label: t("principal.leaveInbox"), node: <LeaveInbox /> },
    { id: "timings", label: t("principal.timingManager"), node: <TimingManager /> },
    { id: "alert", label: t("principal.emergencyAlert"), node: <EmergencyAlertManager /> },
    { id: "settings", label: t("principal.settings"), node: <SettingsManager /> },
    { id: "gallery", label: t("principal.gallery"), node: <GalleryManager /> },
    { id: "resources", label: t("principal.resources"), node: <ResourcesManager /> },
    { id: "messages", label: t("principal.messages"), node: <ParentMessagesManager /> },
    { id: "enquiries", label: t("principal.enquiries"), node: <AdmissionsManager /> },
    { id: "calendar", label: t("principal.calendar"), node: <CalendarManager /> },
    { id: "achievements", label: t("principal.achievements"), node: <AchievementsManager /> },
    { id: "faqs", label: t("principal.faqs"), node: <FaqManager /> },
    { id: "audit", label: t("principal.audit"), node: <AuditViewer /> },
  ];

  return (
    <AdminShell title={t("principal.title")}>
      <Seo title={t("principal.title")} noindex path="/admin/principal" />
      <div className="mb-4">
        <Link to="/admin/teacher" className="btn btn-outline">
          {t("teacher.title")}
        </Link>
      </div>
      <Tabs tabs={tabs} />
    </AdminShell>
  );
}
