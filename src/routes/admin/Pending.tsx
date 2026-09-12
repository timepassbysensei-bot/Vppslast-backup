import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/providers/AuthProvider";

export function Pending() {
  const { t } = useTranslation();
  const { loading, session, role, status, isPrincipal, isApprovedStaff, signOut } = useAuth();

  if (loading) {
    return (
      <AuthShell title={t("auth.pendingTitle")}>
        <Spinner label={t("auth.checkingAccess")} />
      </AuthShell>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace />;
  if (!role) {
    return (
      <AuthShell title={t("auth.pendingTitle")}>
        <Spinner label={t("auth.checkingAccess")} />
      </AuthShell>
    );
  }

  // Route approved users straight to their dashboard.
  if (isPrincipal) return <Navigate to="/admin/principal" replace />;
  if (isApprovedStaff) return <Navigate to="/admin/teacher" replace />;

  const title =
    status === "rejected" ? t("auth.rejectedTitle") : status === "suspended" ? t("auth.suspendedTitle") : t("auth.pendingTitle");
  const body =
    status === "rejected" ? t("auth.rejectedBody") : status === "suspended" ? t("auth.suspendedBody") : t("auth.pendingBody");
  const kind = status === "pending" ? "info" : "error";

  return (
    <AuthShell title={title}>
      <Seo title={title} noindex path="/admin/pending" />
      <div className="card p-4">
        <StatusMessage kind={kind}>{body}</StatusMessage>
        <div className="mt-3">
          <Button variant="outline" onClick={() => void signOut()} className="w-full">
            {t("common.signOut")}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
