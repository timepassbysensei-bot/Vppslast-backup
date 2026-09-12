import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignedFileLink } from "@/components/SignedFileLink";
import { DeleteButton } from "@/components/DeleteButton";
import { useLeaveInbox, useLeaveDecision } from "@/hooks/principal";
import { useLang } from "@/hooks/useLang";
import { formatDate, timeUntil } from "@/lib/time";

export function LeaveInbox() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useLeaveInbox();
  const decide = useLeaveDecision();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decisionFor = (id: string) => (data?.decisions ?? []).find((d) => d.request_id === id) ?? null;

  async function act(id: string, decision: "approved" | "rejected"): Promise<void> {
    await decide.mutateAsync({ request_id: id, decision, note: notes[id]?.trim() || null });
  }

  return (
    <Card>
      <SectionHeading>{t("principal.leaveInbox")}</SectionHeading>
      {isLoading ? (
        <Spinner />
      ) : (data?.requests ?? []).length === 0 ? (
        <EmptyState>{t("teacher.noLeave")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data?.requests ?? []).map((r) => {
            const decision = decisionFor(r.id);
            const pending = r.status === "pending";
            return (
              <li key={r.id} className="border border-ink/10 rounded-card p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-navy">{r.full_name ?? r.email ?? r.teacher_id}</span>
                  <span className="text-ink/60">{r.email}</span>
                  <span className="badge">{r.status}</span>
                  <span className="ml-auto text-xs text-ink/60">
                    {t("common.deletesInLabel")}: {timeUntil(r.expires_at)}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  {formatDate(r.start_date, lang)} – {formatDate(r.end_date, lang)} {r.half_day ? `(${t("teacher.halfDay")})` : ""}
                </p>
                <p className="text-sm text-ink/80 mt-1">{r.reason}</p>
                {decision?.note ? (
                  <p className="text-sm mt-1">
                    <span className="font-semibold">{t("teacher.decisionNote")}: </span>
                    {decision.note}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  {r.attachment_bucket && r.attachment_path ? <SignedFileLink kind="leave_attachment" recordId={r.id} /> : null}
                  {pending ? (
                    <>
                      <input
                        className="field-input py-1 flex-1 min-w-[10rem]"
                        placeholder={t("principal.leaveNote")}
                        value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      />
                      <Button className="px-3 py-1 text-sm" disabled={decide.isPending} onClick={() => void act(r.id, "approved")}>
                        {t("principal.approveLeave")}
                      </Button>
                      <Button variant="danger" className="px-3 py-1 text-sm" disabled={decide.isPending} onClick={() => void act(r.id, "rejected")}>
                        {t("principal.rejectLeave")}
                      </Button>
                    </>
                  ) : null}
                  <DeleteButton contentType="leave_request" recordId={r.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
