import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRoster } from "@/hooks/principal";
import { useApproveTeacher } from "@/hooks/actions";
import { useAuth } from "@/providers/AuthProvider";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";
import { FunctionError } from "@/lib/functions";

export function StaffRoster() {
  const { t } = useTranslation();
  const lang = useLang();
  const { user } = useAuth();
  const { data, isLoading } = useRoster();
  const approve = useApproveTeacher();
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function dismiss(target: string): Promise<void> {
    setError(null);
    try {
      await approve.mutateAsync({ target_user_id: target, action: "suspend" });
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof FunctionError ? err.message : t("common.error"));
    }
  }

  return (
    <Card>
      <SectionHeading>{t("principal.roster")}</SectionHeading>
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("principal.noRoster")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((s) => (
            <li key={s.user_id} className="border border-ink/10 rounded-card p-3 flex flex-wrap items-center gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">
                  {s.full_name ?? s.email ?? s.user_id} {s.role === "principal" ? "★" : ""}
                </p>
                <p className="text-sm text-ink/60 truncate">{s.email}</p>
                <p className="text-xs text-ink/50">
                  <span className="badge mr-2">{s.status}</span>
                  {s.approved_at ? `${t("principal.approvedOn")}: ${formatDate(s.approved_at, lang)}` : ""}
                </p>
              </div>
              {s.role !== "principal" && s.status === "approved" && s.user_id !== user?.id ? (
                <div className="ml-auto">
                  <Button variant="danger" className="px-3 py-1 text-sm" onClick={() => setConfirmId(s.user_id)}>
                    {t("principal.dismiss")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(confirmId)}
        loading={approve.isPending}
        title={t("principal.dismiss")}
        body={t("auth.suspendedBody")}
        confirmLabel={t("principal.dismiss")}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && void dismiss(confirmId)}
      />
    </Card>
  );
}
