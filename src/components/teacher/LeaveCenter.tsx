import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignedFileLink } from "@/components/SignedFileLink";
import { DeleteButton } from "@/components/DeleteButton";
import { useMyLeave, useSubmitLeave, useCancelLeave } from "@/hooks/staff";
import { useLang } from "@/hooks/useLang";
import { formatDate, kolkataTodayISO, timeUntil } from "@/lib/time";

export function LeaveCenter() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useMyLeave();
  const submit = useSubmitLeave();
  const cancel = useCancelLeave();

  const [start, setStart] = useState(kolkataTodayISO());
  const [end, setEnd] = useState(kolkataTodayISO());
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!reason.trim() || end < start) {
      setError(t("common.error"));
      return;
    }
    try {
      await submit.mutateAsync({ start_date: start, end_date: end, half_day: halfDay, reason: reason.trim(), file });
      setSuccess(true);
      setReason("");
      setFile(null);
    } catch {
      setError(t("common.error"));
    }
  }

  const decisionFor = (requestId: string) => (data?.decisions ?? []).find((d) => d.request_id === requestId) ?? null;

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("teacher.leaveCenter")}</SectionHeading>
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{t("teacher.leaveStart")}</span>
              <input type="date" className="field-input" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">{t("teacher.leaveEnd")}</span>
              <input type="date" className="field-input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} />
            <span>{t("teacher.halfDay")}</span>
          </label>
          <TextArea label={t("teacher.leaveReason")} value={reason} onChange={(e) => setReason(e.target.value)} />
          <label className="block">
            <span className="field-label">{t("teacher.leaveAttachment")}</span>
            <input type="file" accept="image/*,application/pdf" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.leaveSubmitted")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={submit.isPending}>
              {t("teacher.submitLeave")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("teacher.leaveCenter")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data?.requests ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noLeave")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data?.requests ?? []).map((r) => {
              const decision = decisionFor(r.id);
              return (
                <li key={r.id} className="border border-ink/10 rounded-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="badge">{r.status}</span>
                    <span>
                      {formatDate(r.start_date, lang)} – {formatDate(r.end_date, lang)} {r.half_day ? `(${t("teacher.halfDay")})` : ""}
                    </span>
                    <span className="ml-auto text-xs text-ink/60">
                      {t("common.deletesInLabel")}: {timeUntil(r.expires_at)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/80 mt-1">{r.reason}</p>
                  {decision?.note ? (
                    <p className="text-sm mt-1">
                      <span className="font-semibold">{t("teacher.decisionNote")}: </span>
                      {decision.note}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.attachment_bucket && r.attachment_path ? <SignedFileLink kind="leave_attachment" recordId={r.id} /> : null}
                    {r.status === "pending" ? (
                      <Button variant="outline" className="px-3 py-1 text-sm" disabled={cancel.isPending} onClick={() => cancel.mutate(r.id)}>
                        {t("teacher.cancelRequest")}
                      </Button>
                    ) : null}
                    <DeleteButton contentType="leave_request" recordId={r.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
