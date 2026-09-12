import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { ClassSectionSelect, type ClassSelection } from "@/components/ClassSectionSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useCreateClassNotice, useMyClassNotices, useUpdateClassNotice } from "@/hooks/staff";
import { useAuth } from "@/providers/AuthProvider";
import { useLang } from "@/hooks/useLang";
import { formatDate, timeUntil } from "@/lib/time";
import type { ClassNotice } from "@/lib/types";

export function ClassNoticeManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const { user, isPrincipal } = useAuth();
  const create = useCreateClassNotice();
  const update = useUpdateClassNotice();
  const list = useMyClassNotices();

  const [sel, setSel] = useState<ClassSelection>({ classCode: "", section: "" });
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentHi, setContentHi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState<ClassNotice | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!sel.classCode || !titleEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        class_code: sel.classCode,
        section: sel.section || null,
        title_en: titleEn.trim(),
        title_hi: titleHi.trim() || null,
        content_en: contentEn.trim() || null,
        content_hi: contentHi.trim() || null,
      });
      setSuccess(true);
      setTitleEn("");
      setTitleHi("");
      setContentEn("");
      setContentHi("");
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("teacher.classNotices")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <ClassSectionSelect value={sel} onChange={setSel} />
          <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          <TextArea label={t("teacher.contentEn")} value={contentEn} onChange={(e) => setContentEn(e.target.value)} />
          <TextArea label={t("teacher.contentHi")} value={contentHi} onChange={(e) => setContentHi(e.target.value)} />
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.noticeSaved")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {t("teacher.createNotice")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("teacher.classNotices")}</SectionHeading>
        {list.isLoading ? (
          <Spinner />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noNotices")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(list.data ?? []).map((n) => {
              const mine = n.created_by === user?.id;
              return (
                <li key={n.id} className="border border-ink/10 rounded-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                    <span className="badge">
                      {t("common.class")} {n.class_code}
                      {n.section ? ` · ${n.section}` : ""}
                    </span>
                    <span>{formatDate(n.created_at, lang)}</span>
                    <span className="ml-auto text-xs">
                      {t("common.deletesInLabel")}: {timeUntil(n.expires_at)}
                    </span>
                  </div>
                  <Bilingual as="h3" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy mt-1" showFallbackNote={false} />
                  <Bilingual as="p" en={n.content_en} hi={n.content_hi} className="text-sm text-ink/80" />
                  {mine || isPrincipal ? (
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" className="px-3 py-1 text-sm" onClick={() => setEditing(n)}>
                        {t("common.edit")}
                      </Button>
                      <DeleteButton contentType="class_notice" recordId={n.id} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title={t("common.edit")}>
        {editing ? (
          <EditForm
            notice={editing}
            saving={update.isPending}
            onSave={async (patch) => {
              await update.mutateAsync({ id: editing.id, patch });
              setEditing(null);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function EditForm({
  notice,
  saving,
  onSave,
}: {
  notice: ClassNotice;
  saving: boolean;
  onSave: (patch: Partial<ClassNotice>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [titleEn, setTitleEn] = useState(notice.title_en);
  const [titleHi, setTitleHi] = useState(notice.title_hi ?? "");
  const [contentEn, setContentEn] = useState(notice.content_en ?? "");
  const [contentHi, setContentHi] = useState(notice.content_hi ?? "");

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          title_en: titleEn.trim(),
          title_hi: titleHi.trim() || null,
          content_en: contentEn.trim() || null,
          content_hi: contentHi.trim() || null,
        });
      }}
    >
      <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
      <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
      <TextArea label={t("teacher.contentEn")} value={contentEn} onChange={(e) => setContentEn(e.target.value)} />
      <TextArea label={t("teacher.contentHi")} value={contentHi} onChange={(e) => setContentHi(e.target.value)} />
      <div>
        <Button type="submit" disabled={saving}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
