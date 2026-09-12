import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { useParentMessages, useAdmissionEnquiries, useUpdateMessageStatus } from "@/hooks/principal";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";
import type { MessageStatus } from "@/lib/types";

function StatusControls({
  kind,
  id,
  status,
  notes,
}: {
  kind: "parent_messages" | "admission_enquiries";
  id: string;
  status: MessageStatus;
  notes: string | null;
}) {
  const { t } = useTranslation();
  const update = useUpdateMessageStatus(kind);
  const [note, setNote] = useState(notes ?? "");
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm flex items-center gap-2">
          {t("common.status")}:
          <select
            className="field-input py-1"
            value={status}
            onChange={(e) => update.mutate({ id, status: e.target.value as MessageStatus })}
          >
            <option value="new">new</option>
            <option value="in_progress">in progress</option>
            <option value="resolved">resolved</option>
          </select>
        </label>
        <DeleteButton contentType={kind === "parent_messages" ? "parent_message" : "admission_enquiry"} recordId={id} label={t("common.delete")} />
      </div>
      <label className="block">
        <span className="field-label">{t("principal.internalNotesLabel")}</span>
        <textarea className="field-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div>
        <Button variant="outline" className="px-3 py-1 text-sm" disabled={update.isPending} onClick={() => update.mutate({ id, internal_notes: note })}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

export function ParentMessagesManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useParentMessages();
  return (
    <Card>
      <SectionHeading>{t("principal.messages")}</SectionHeading>
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("principal.noMessages")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((m) => (
            <li key={m.id} className="border border-ink/10 rounded-card p-3">
              <p className="text-sm text-ink/60">{formatDate(m.created_at, lang)}</p>
              <p className="font-semibold text-navy">
                {m.sender_name} · {m.phone}
              </p>
              <p className="text-sm">
                {t("forms.studentName")}: {m.student_name}
                {m.class_code ? ` · ${t("common.class")} ${m.class_code}${m.section ? ` · ${m.section}` : ""}` : ""}
              </p>
              <p className="text-ink/80 mt-1 whitespace-pre-line">{m.message}</p>
              <StatusControls kind="parent_messages" id={m.id} status={m.status} notes={m.internal_notes} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function AdmissionsManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useAdmissionEnquiries();
  return (
    <Card>
      <SectionHeading>{t("principal.enquiries")}</SectionHeading>
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("principal.noEnquiries")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((m) => (
            <li key={m.id} className="border border-ink/10 rounded-card p-3">
              <p className="text-sm text-ink/60">{formatDate(m.created_at, lang)}</p>
              <p className="font-semibold text-navy">
                {m.guardian_name} · {m.phone}
                {m.email ? ` · ${m.email}` : ""}
              </p>
              <p className="text-sm">
                {t("forms.studentName")}: {m.student_name} · {t("forms.classApplying")}: {m.class_applying}
                {m.current_school ? ` · ${m.current_school}` : ""}
              </p>
              {m.message ? <p className="text-ink/80 mt-1 whitespace-pre-line">{m.message}</p> : null}
              <StatusControls kind="admission_enquiries" id={m.id} status={m.status} notes={m.internal_notes} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
