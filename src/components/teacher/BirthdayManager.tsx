import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClassSectionSelect, type ClassSelection } from "@/components/ClassSectionSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { useCreateBirthday, useMyBirthdays } from "@/hooks/staff";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { BirthdayPublishMode } from "@/lib/types";

export function BirthdayManager() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user, isPrincipal } = useAuth();
  const create = useCreateBirthday();
  const list = useMyBirthdays();

  const [sel, setSel] = useState<ClassSelection>({ classCode: "", section: "" });
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [greetingEn, setGreetingEn] = useState("");
  const [greetingHi, setGreetingHi] = useState("");
  const [mode, setMode] = useState<BirthdayPublishMode>("text_only");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim() || !dob) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        student_name: name.trim(),
        class_code: sel.classCode || null,
        section: sel.section || null,
        dob,
        greeting_en: greetingEn.trim() || null,
        greeting_hi: greetingHi.trim() || null,
        publish_mode: mode,
        file: mode === "with_photo" ? file : null,
      });
      setSuccess(true);
      setName("");
      setDob("");
      setGreetingEn("");
      setGreetingHi("");
      setFile(null);
    } catch {
      setError(t("common.error"));
    }
  }

  async function updateMode(id: string, publish_mode: BirthdayPublishMode): Promise<void> {
    await supabase.from("birthday_profiles").update({ publish_mode }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["birthdays_admin"] });
    void qc.invalidateQueries({ queryKey: ["birthdays_today"] });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("teacher.birthdays")}</SectionHeading>
        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3">
          <TextInput label={t("teacher.studentName")} value={name} onChange={(e) => setName(e.target.value)} />
          <ClassSectionSelect value={sel} onChange={setSel} />
          <label className="block">
            <span className="field-label">{t("teacher.dob")}</span>
            <input type="date" className="field-input" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
          <TextInput label={t("teacher.greetingEn")} value={greetingEn} onChange={(e) => setGreetingEn(e.target.value)} />
          <TextInput label={t("teacher.greetingHi")} value={greetingHi} onChange={(e) => setGreetingHi(e.target.value)} />
          <label className="block">
            <span className="field-label">{t("teacher.publishMode")}</span>
            <select className="field-input" value={mode} onChange={(e) => setMode(e.target.value as BirthdayPublishMode)}>
              <option value="text_only">{t("teacher.publishTextOnly")}</option>
              <option value="with_photo">{t("teacher.publishWithPhoto")}</option>
              <option value="not_public">{t("teacher.publishNotPublic")}</option>
            </select>
          </label>
          {mode === "with_photo" ? (
            <label className="block">
              <span className="field-label">{t("teacher.photo")}</span>
              <input type="file" accept="image/*" capture="environment" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          ) : null}
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("teacher.birthdaySaved")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={create.isPending}>
              {t("teacher.addBirthday")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("teacher.birthdays")}</SectionHeading>
        {list.isLoading ? (
          <Spinner />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState>{t("teacher.noBirthdays")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(list.data ?? []).map((b) => {
              const mine = b.created_by === user?.id;
              return (
                <li key={b.id} className="border border-ink/10 rounded-card p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy">{b.student_name}</span>
                    {b.class_code ? (
                      <span className="badge">
                        {t("common.class")} {b.class_code}
                        {b.section ? ` · ${b.section}` : ""}
                      </span>
                    ) : null}
                    <span className="text-xs text-ink/50">{b.dob}</span>
                  </div>
                  {mine || isPrincipal ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-sm flex items-center gap-2">
                        {t("teacher.publishMode")}:
                        <select
                          className="field-input py-1"
                          value={b.publish_mode}
                          onChange={(e) => void updateMode(b.id, e.target.value as BirthdayPublishMode)}
                        >
                          <option value="text_only">{t("teacher.publishTextOnly")}</option>
                          <option value="with_photo">{t("teacher.publishWithPhoto")}</option>
                          <option value="not_public">{t("teacher.publishNotPublic")}</option>
                        </select>
                      </label>
                      <DeleteButton contentType="birthday" recordId={b.id} />
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
