import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

type Need = "staff" | "principal";

// Central admin gate. Waits for the initial session + role check so protected
// content never flashes, then routes by the live status from user_roles.
export function AdminRoute({ need, children }: { need: Need; children: ReactNode }) {
  const { t } = useTranslation();
  const { loading, session, role, isPrincipal, isApprovedStaff } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label={t("auth.checkingAccess")} />
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace />;
  if (!role) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Spinner label={t("auth.checkingAccess")} />
      </div>
    );
  }

  if (need === "principal") {
    if (isPrincipal) return <>{children}</>;
    if (isApprovedStaff) return <Navigate to="/admin/teacher" replace />;
    return <Navigate to="/admin/pending" replace />;
  }

  // need === "staff"
  if (isApprovedStaff) return <>{children}</>;
  return <Navigate to="/admin/pending" replace />;
}
