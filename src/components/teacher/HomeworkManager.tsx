import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClassSectionSelect, type ClassSelection } from "@/components/ClassSectionSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useCreateHomework, useRecentHomework } from "@/hooks/staff";
import { useAuth } from "@/providers/AuthProvider";
import { useLang } from "@/hooks/useLang";
import { formatDate, kolkataTodayISO, timeUntil } from "@/lib/time";
import { publicUrl } from "@/lib/supabase";

export function HomeworkManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const { user, isPrincipal } = useAuth();
  const create = useCreateHomework();
  const recent = useRecentHomework();

  const [sel, setSel] = useState<ClassSelection>({ classCode: "", section: "" });
  const [date, setDate] = useState(kolkataTodayISO());
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onFiles(list: FileList | null): void {
    if (!list) return;
    const files = Array.from(list);
    if (files.length > 2) {
      setError(t("teacher.maxTwoImages"));
      setImages(files.slice(0, 2));
      return;
    }
    setError(null);
    setImages(files);
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!sel.classCode || !descEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        class_code: sel.classCode,
        section: sel.section || null,
        homework_date: date,
        description_en: descEn.trim(),
        description_hi: descHi.trim() || null,
        images,
      });
      setSuccess(true);
      setDescEn("");
      setDescHi("");
      setImages([]);
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("teacher.homeworkUploader")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <ClassSectionSelect value={sel} onChange={setSel} />
          <label className="block">
            <span className="field-label">{t("common.date")}</span>
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <TextArea label={t("teacher.descriptionEn")} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          <TextArea label={t("teacher.descriptionHi")} value={descHi} onChange={(e) => setDescHi(e.target.value)} />
          <label className="block">
            <span className="field-label">{t("teacher.images")}</span>
            <input
              type="file"
              accept="image/*"
              
              multiple
              className="field-input"
              onChange={(e) => onFiles(e.target.files)}
            />
            <span className="text-xs text-ink/60">{t("teacher.chooseImages")} — {images.length}/2</span>
          </label>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.homeworkPosted")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("forms.sending") : t("teacher.postHomework")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("teacher.recentHomework")}</SectionHeading>
        {recent.isLoading ? (
          <Spinner />
        ) : (recent.data ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noHomework")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(recent.data ?? []).map((hw) => {
              const mine = hw.created_by === user?.id;
              return (
                <li key={hw.id} className="border border-ink/10 rounded-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                    <span className="badge">
                      {t("common.class")} {hw.class_code}
                      {hw.section ? ` · ${hw.section}` : ""}
                    </span>
                    <span>{formatDate(hw.homework_date, lang)}</span>
                    <span>{t("teacher.imageCount", { count: hw.image_paths.length })}</span>
                    {mine ? <span className="badge">{t("teacher.createdByYou")}</span> : null}
                    <span className="ml-auto text-xs">
                      {t("common.deletesInLabel")}: {timeUntil(hw.expires_at)}
                    </span>
                  </div>
                  <Bilingual as="p" en={hw.description_en} hi={hw.description_hi} className="mt-1" />
                  {hw.image_paths.length > 0 ? (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {hw.image_paths.map((p) => (
                        <img key={p} src={publicUrl("homework", p)} alt="" className="h-20 w-20 object-cover rounded-card border" />
                      ))}
                    </div>
                  ) : null}
                  {mine || isPrincipal ? (
                    <div className="mt-2">
                      <DeleteButton contentType="homework" recordId={hw.id} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
