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
import { useEventsAdmin, useCreateCalendarEvent } from "@/hooks/principal";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";

export function CalendarManager() {
  const { t } = useTranslation();
  const lang = useLang();
  const create = useCreateCalendarEvent();
  const { data, isLoading } = useEventsAdmin();

  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!titleEn.trim() || !start) {
      setError(t("common.error"));
      return;
    }
    try {
      await create.mutateAsync({
        title_en: titleEn.trim(),
        title_hi: titleHi.trim() || null,
        description_en: descEn.trim() || null,
        start_date: start,
        end_date: end || null,
      });
      setSuccess(true);
      setTitleEn("");
      setTitleHi("");
      setDescEn("");
      setStart("");
      setEnd("");
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.calendar")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          <TextArea label="Description (English)" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={2} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Start date</span>
              <input type="date" className="field-input" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block">
              <span className="field-label">End date ({t("common.optional")})</span>
              <input type="date" className="field-input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
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
        <SectionHeading>{t("principal.calendar")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("common.none")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data ?? []).map((e) => (
              <li key={e.id} className="border border-ink/10 rounded-card p-3">
                <p className="text-sm text-amber font-semibold">
                  {formatDate(e.start_date, lang)}
                  {e.end_date ? ` – ${formatDate(e.end_date, lang)}` : ""}
                </p>
                <Bilingual as="h3" en={e.title_en} hi={e.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                <div className="mt-2">
                  <DeleteButton contentType="calendar_event" recordId={e.id} label={t("common.delete")} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
