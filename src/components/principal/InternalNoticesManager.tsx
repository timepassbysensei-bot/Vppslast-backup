import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea, Select } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignedFileLink } from "@/components/SignedFileLink";
import { DeleteButton } from "@/components/DeleteButton";
import { useCreateInternalNotice, useInternalNoticesAdmin } from "@/hooks/principal";
import { useLang } from "@/hooks/useLang";
import { formatDate, timeUntil } from "@/lib/time";
import type { NoticePriority } from "@/lib/types";

export function InternalNoticesManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const create = useCreateInternalNotice();
  const { data, isLoading } = useInternalNoticesAdmin();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!title.trim() || !content.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({ title: title.trim(), content: content.trim(), priority, file });
      setSuccess(true);
      setTitle("");
      setContent("");
      setFile(null);
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.internalNotices")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <TextInput label={t("teacher.titleEn")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextArea label={t("teacher.contentEn")} value={content} onChange={(e) => setContent(e.target.value)} />
          <Select label={t("common.priority")} value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)}>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </Select>
          <label className="block">
            <span className="field-label">{t("common.attachment")} ({t("common.optional")})</span>
            <input type="file" accept="image/*,application/pdf" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.noticeSaved")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("principal.internalNotices")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data?.notices ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noInternalNotices")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data?.notices ?? []).map((n) => (
              <li key={n.id} className="border border-ink/10 rounded-card p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <span className="badge">{n.priority}</span>
                  <span>{formatDate(n.created_at, lang)}</span>
                  <span className="badge">{t("teacher.markedRead")}: {data?.readCounts[n.id] ?? 0}</span>
                  <span className="ml-auto text-xs">
                    {t("common.deletesInLabel")}: {timeUntil(n.expires_at)}
                  </span>
                </div>
                <h3 className="font-semibold text-navy mt-1">{n.title}</h3>
                <p className="text-sm text-ink/80 whitespace-pre-line">{n.content}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {n.attachment_bucket && n.attachment_path ? <SignedFileLink kind="internal_notice" recordId={n.id} /> : null}
                  <DeleteButton contentType="internal_notice" recordId={n.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
