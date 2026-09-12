import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFaqsAdmin, useUpsertFaq } from "@/hooks/principal";

export function FaqManager() {
  const { t } = useTranslation();
  const upsert = useUpsertFaq();
  const { data, isLoading } = useFaqsAdmin();

  const [qEn, setQEn] = useState("");
  const [qHi, setQHi] = useState("");
  const [aEn, setAEn] = useState("");
  const [aHi, setAHi] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!qEn.trim() || !aEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await upsert.mutateAsync({
        patch: {
          question_en: qEn.trim(),
          question_hi: qHi.trim() || null,
          answer_en: aEn.trim(),
          answer_hi: aHi.trim() || null,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          is_active: true,
        },
      });
      setSuccess(true);
      setQEn("");
      setQHi("");
      setAEn("");
      setAHi("");
      setTags("");
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.faqs")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <TextInput label="Question (English)" value={qEn} onChange={(e) => setQEn(e.target.value)} />
          <TextInput label="Question (Hindi)" value={qHi} onChange={(e) => setQHi(e.target.value)} />
          <TextArea label="Answer (English)" value={aEn} onChange={(e) => setAEn(e.target.value)} rows={2} />
          <TextArea label="Answer (Hindi)" value={aHi} onChange={(e) => setAHi(e.target.value)} rows={2} />
          <TextInput label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("common.save")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={upsert.isPending}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("principal.faqs")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("common.none")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data ?? []).map((f) => (
              <li key={f.id} className="border border-ink/10 rounded-card p-3">
                <p className="font-semibold text-navy">{f.question_en}</p>
                <p className="text-sm text-ink/80">{f.answer_en}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`badge ${f.is_active ? "text-success border-success/40" : ""}`}>
                    {f.is_active ? "active" : "inactive"}
                  </span>
                  <Button
                    variant="outline"
                    className="px-3 py-1 text-sm"
                    disabled={upsert.isPending}
                    onClick={() => upsert.mutate({ id: f.id, patch: { is_active: !f.is_active } })}
                  >
                    {f.is_active ? t("principal.unpublish") : t("principal.publish")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
