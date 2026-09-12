import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea, Select, Checkbox } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { usePublicNoticesAdmin, useSavePublicNotice } from "@/hooks/principal";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";
import type { NoticePriority, PublicNotice } from "@/lib/types";

type Draft = {
  title_en: string;
  title_hi: string;
  summary_en: string;
  summary_hi: string;
  content_en: string;
  content_hi: string;
  category: string;
  priority: NoticePriority;
  pinned: boolean;
  urgent: boolean;
  is_published: boolean;
  effective_at: string;
  expiry_at: string;
};

function emptyDraft(): Draft {
  return {
    title_en: "",
    title_hi: "",
    summary_en: "",
    summary_hi: "",
    content_en: "",
    content_hi: "",
    category: "general",
    priority: "normal",
    pinned: false,
    urgent: false,
    is_published: true,
    effective_at: new Date().toISOString().slice(0, 10),
    expiry_at: "",
  };
}

function toPatch(d: Draft): Partial<PublicNotice> {
  return {
    title_en: d.title_en.trim(),
    title_hi: d.title_hi.trim() || null,
    summary_en: d.summary_en.trim() || null,
    summary_hi: d.summary_hi.trim() || null,
    content_en: d.content_en.trim() || null,
    content_hi: d.content_hi.trim() || null,
    category: d.category.trim() || "general",
    priority: d.priority,
    pinned: d.pinned,
    urgent: d.urgent,
    is_published: d.is_published,
    effective_at: new Date(`${d.effective_at}T00:00:00`).toISOString(),
    expiry_at: d.expiry_at ? new Date(`${d.expiry_at}T23:59:59`).toISOString() : null,
  };
}

function NoticeForm({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const { t } = useTranslation();
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  return (
    <div className="grid gap-3">
      <TextInput label={t("teacher.titleEn")} value={draft.title_en} onChange={(e) => set({ title_en: e.target.value })} />
      <TextInput label={t("teacher.titleHi")} value={draft.title_hi} onChange={(e) => set({ title_hi: e.target.value })} />
      <TextArea label="Summary (English)" value={draft.summary_en} onChange={(e) => set({ summary_en: e.target.value })} rows={2} />
      <TextArea label="Summary (Hindi)" value={draft.summary_hi} onChange={(e) => set({ summary_hi: e.target.value })} rows={2} />
      <TextArea label={t("teacher.contentEn")} value={draft.content_en} onChange={(e) => set({ content_en: e.target.value })} />
      <TextArea label={t("teacher.contentHi")} value={draft.content_hi} onChange={(e) => set({ content_hi: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Category" value={draft.category} onChange={(e) => set({ category: e.target.value })} />
        <Select label={t("common.priority")} value={draft.priority} onChange={(e) => set({ priority: e.target.value as NoticePriority })}>
          <option value="normal">normal</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Effective date</span>
          <input type="date" className="field-input" value={draft.effective_at} onChange={(e) => set({ effective_at: e.target.value })} />
        </label>
        <label className="block">
          <span className="field-label">Expiry date ({t("common.optional")})</span>
          <input type="date" className="field-input" value={draft.expiry_at} onChange={(e) => set({ expiry_at: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <Checkbox label="Pinned" checked={draft.pinned} onChange={(e) => set({ pinned: e.target.checked })} />
        <Checkbox label="Urgent" checked={draft.urgent} onChange={(e) => set({ urgent: e.target.checked })} />
        <Checkbox label={t("principal.publish")} checked={draft.is_published} onChange={(e) => set({ is_published: e.target.checked })} />
      </div>
    </div>
  );
}

export function PublicNoticesManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const save = useSavePublicNotice();
  const { data, isLoading } = usePublicNoticesAdmin();

  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editing, setEditing] = useState<PublicNotice | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [msg, setMsg] = useState<string | null>(null);

  async function create(): Promise<void> {
    if (!draft.title_en.trim()) return;
    await save.mutateAsync({ patch: toPatch(draft) });
    setDraft(emptyDraft());
    setMsg(t("teacher.noticeSaved"));
  }

  function openEdit(n: PublicNotice): void {
    setEditing(n);
    setEditDraft({
      title_en: n.title_en,
      title_hi: n.title_hi ?? "",
      summary_en: n.summary_en ?? "",
      summary_hi: n.summary_hi ?? "",
      content_en: n.content_en ?? "",
      content_hi: n.content_hi ?? "",
      category: n.category,
      priority: n.priority,
      pinned: n.pinned,
      urgent: n.urgent,
      is_published: n.is_published,
      effective_at: n.effective_at.slice(0, 10),
      expiry_at: n.expiry_at ? n.expiry_at.slice(0, 10) : "",
    });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.publicNotices")}</SectionHeading>
        <NoticeForm draft={draft} onChange={setDraft} />
        {msg ? <div className="mt-2"><StatusMessage kind="success">{msg}</StatusMessage></div> : null}
        <div className="mt-3">
          <Button disabled={save.isPending} onClick={() => void create()}>
            {t("common.create")}
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeading>{t("principal.publicNotices")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noNotices")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data ?? []).map((n) => (
              <li key={n.id} className="border border-ink/10 rounded-card p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <span className={`badge ${n.is_published ? "text-success border-success/40" : ""}`}>
                    {n.is_published ? t("principal.published") : t("principal.unpublished")}
                  </span>
                  {n.pinned ? <span className="badge">★</span> : null}
                  {n.urgent ? <span className="badge text-danger border-danger/40">urgent</span> : null}
                  <span>{formatDate(n.effective_at, lang)}</span>
                </div>
                <Bilingual as="h3" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy mt-1" showFallbackNote={false} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" className="px-3 py-1 text-sm" onClick={() => openEdit(n)}>
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    className="px-3 py-1 text-sm"
                    disabled={save.isPending}
                    onClick={() => void save.mutateAsync({ id: n.id, patch: { is_published: !n.is_published } })}
                  >
                    {n.is_published ? t("principal.unpublish") : t("principal.publish")}
                  </Button>
                  <DeleteButton contentType="public_notice" recordId={n.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title={t("common.edit")}>
        <NoticeForm draft={editDraft} onChange={setEditDraft} />
        <div className="mt-3">
          <Button
            disabled={save.isPending}
            onClick={async () => {
              if (editing) {
                await save.mutateAsync({ id: editing.id, patch: toPatch(editDraft) });
                setEditing(null);
              }
            }}
          >
            {t("common.save")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
