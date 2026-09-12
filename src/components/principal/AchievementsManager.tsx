import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useAchievementsAdmin, useCreateAchievement } from "@/hooks/principal";
import { publicUrl } from "@/lib/supabase";

export function AchievementsManager() {
  const { t } = useTranslation();
  const create = useCreateAchievement();
  const { data, isLoading } = useAchievementsAdmin();

  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!titleEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        title_en: titleEn.trim(),
        title_hi: titleHi.trim() || null,
        description_en: descEn.trim() || null,
        description_hi: descHi.trim() || null,
        event_date: date || null,
        file,
      });
      setSuccess(true);
      setTitleEn("");
      setTitleHi("");
      setDescEn("");
      setDescHi("");
      setDate("");
      setFile(null);
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.achievements")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          <TextArea label="Description (English)" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={2} />
          <TextArea label="Description (Hindi)" value={descHi} onChange={(e) => setDescHi(e.target.value)} rows={2} />
          <label className="block">
            <span className="field-label">{t("common.date")} ({t("common.optional")})</span>
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">{t("teacher.photo")}</span>
            <input type="file" accept="image/*" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("common.save")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("principal.achievements")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("common.none")}</EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(data ?? []).map((a) => {
              const img = a.image_url ?? (a.image_bucket && a.image_path ? publicUrl(a.image_bucket, a.image_path) : null);
              return (
                <li key={a.id} className="border border-ink/10 rounded-card p-3">
                  {img ? <img src={img} alt="" className="w-full h-32 object-cover rounded-card mb-2" /> : null}
                  <Bilingual as="h3" en={a.title_en} hi={a.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                  <div className="mt-2">
                    <DeleteButton contentType="achievement" recordId={a.id} label={t("common.delete")} />
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
