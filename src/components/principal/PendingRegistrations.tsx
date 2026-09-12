import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { usePendingStaff } from "@/hooks/principal";
import { useApproveTeacher } from "@/hooks/actions";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";
import { FunctionError } from "@/lib/functions";

export function PendingRegistrations() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = usePendingStaff();
  const approve = useApproveTeacher();
  const [error, setError] = useState<string | null>(null);

  async function act(target: string, action: "approve" | "reject"): Promise<void> {
    setError(null);
    try {
      await approve.mutateAsync({ target_user_id: target, action });
    } catch (err) {
      setError(err instanceof FunctionError ? err.message : t("common.error"));
    }
  }

  return (
    <Card>
      <SectionHeading>{t("principal.pending")}</SectionHeading>
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("principal.noPending")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((s) => (
            <li key={s.user_id} className="border border-ink/10 rounded-card p-3 flex flex-wrap items-center gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">{s.full_name ?? s.email ?? s.user_id}</p>
                <p className="text-sm text-ink/60 truncate">{s.email}</p>
                <p className="text-xs text-ink/50">
                  {t("principal.registeredOn")}: {formatDate(s.created_at, lang)}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button className="px-3 py-1 text-sm" disabled={approve.isPending} onClick={() => void act(s.user_id, "approve")}>
                  {t("principal.approve")}
                </Button>
                <Button variant="danger" className="px-3 py-1 text-sm" disabled={approve.isPending} onClick={() => void act(s.user_id, "reject")}>
                  {t("principal.reject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
