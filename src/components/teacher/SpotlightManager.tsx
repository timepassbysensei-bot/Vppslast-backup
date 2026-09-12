import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClassSectionSelect, type ClassSelection } from "@/components/ClassSectionSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useCreateSpotlight, useMakeSpotlightCurrent, useSpotlights } from "@/hooks/staff";
import { useAuth } from "@/providers/AuthProvider";

export function SpotlightManager() {
  const { t } = useTranslation();
  const { user, isPrincipal } = useAuth();
  const create = useCreateSpotlight();
  const makeCurrent = useMakeSpotlightCurrent();
  const list = useSpotlights();

  const now = new Date();
  const [sel, setSel] = useState<ClassSelection>({ classCode: "", section: "" });
  const [name, setName] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descHi, setDescHi] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [makeCurrentNow, setMakeCurrentNow] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim() || !descEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        student_name: name.trim(),
        class_code: sel.classCode || null,
        section: sel.section || null,
        description_en: descEn.trim(),
        description_hi: descHi.trim() || null,
        month,
        year,
        makeCurrent: makeCurrentNow,
        file,
      });
      setSuccess(true);
      setName("");
      setDescEn("");
      setDescHi("");
      setFile(null);
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("teacher.spotlight")}</SectionHeading>
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3">
          <TextInput label={t("teacher.studentName")} value={name} onChange={(e) => setName(e.target.value)} />
          <ClassSectionSelect value={sel} onChange={setSel} />
          <TextArea label={t("teacher.achievementEn")} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          <TextArea label={t("teacher.achievementHi")} value={descHi} onChange={(e) => setDescHi(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">{t("teacher.month")}</span>
              <input type="number" min={1} max={12} className="field-input" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="field-label">{t("teacher.year")}</span>
              <input type="number" className="field-input" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </label>
          </div>
          <label className="block">
            <span className="field-label">{t("teacher.photo")}</span>
            <input type="file" accept="image/*" capture="environment" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5" checked={makeCurrentNow} onChange={(e) => setMakeCurrentNow(e.target.checked)} />
            <span>{t("teacher.makeCurrent")}</span>
          </label>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.spotlightSaved")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {t("teacher.addSpotlight")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("teacher.spotlight")}</SectionHeading>
        {list.isLoading ? (
          <Spinner />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noSpotlights")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(list.data ?? []).map((s) => {
              const mine = s.created_by === user?.id;
              return (
                <li key={s.id} className="border border-ink/10 rounded-card p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy">{s.student_name}</span>
                    {s.is_current ? <span className="badge text-success border-success/40">★ {t("teacher.makeCurrent")}</span> : null}
                  </div>
                  <Bilingual as="p" en={s.description_en} hi={s.description_hi} className="text-sm text-ink/80 mt-1" />
                  {mine || isPrincipal ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!s.is_current ? (
                        <Button variant="outline" className="px-3 py-1 text-sm" disabled={makeCurrent.isPending} onClick={() => makeCurrent.mutate(s.id)}>
                          {t("teacher.makeCurrent")}
                        </Button>
                      ) : null}
                      <DeleteButton contentType="spotlight" recordId={s.id} />
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
