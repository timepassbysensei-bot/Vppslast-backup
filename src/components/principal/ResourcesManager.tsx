import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput, TextArea, Select } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { SignedFileLink } from "@/components/SignedFileLink";
import { Bilingual } from "@/components/Bilingual";
import { useResourcesAdmin, useUploadResource } from "@/hooks/principal";

export function ResourcesManager() {
  const { t } = useTranslation();
  const upload = useUploadResource();
  const { data, isLoading } = useResourcesAdmin();

  const [file, setFile] = useState<File | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [descEn, setDescEn] = useState("");
  const [category, setCategory] = useState("");
  const [session, setSession] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!file || !titleEn.trim()) {
      setError(t("common.error"));
      return;
    }
    try {
      await upload.mutateAsync({
        file,
        title_en: titleEn.trim(),
        title_hi: titleHi.trim() || null,
        description_en: descEn.trim() || null,
        category: category.trim() || null,
        session: session.trim() || null,
        visibility,
      });
      setSuccess(true);
      setFile(null);
      setTitleEn("");
      setTitleHi("");
      setDescEn("");
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.resources")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <label className="block">
            <span className="field-label">{t("common.attachment")}</span>
            <input type="file" accept="image/*,application/pdf" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          <TextArea label="Description (English)" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={2} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <TextInput label="Session" value={session} onChange={(e) => setSession(e.target.value)} />
          </div>
          <Select label={t("principal.visibility")} value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "private")}>
            <option value="public">{t("principal.public")}</option>
            <option value="private">{t("principal.private")}</option>
          </Select>
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("principal.resourceUploaded")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={upload.isPending}>
              {t("principal.uploadResource")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("principal.resources")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("common.none")}</EmptyState>
        ) : (
          <ul className="grid gap-3">
            {(data ?? []).map((r) => (
              <li key={r.id} className="border border-ink/10 rounded-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Bilingual as="h3" en={r.title_en} hi={r.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                  <span className="badge">{r.visibility === "public" ? t("principal.public") : t("principal.private")}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.visibility === "private" ? (
                    <SignedFileLink kind="resource" recordId={r.id} label={t("common.download")} />
                  ) : (
                    <a className="btn btn-outline px-3 py-1 text-sm" href={r.public_url ?? ""} target="_blank" rel="noopener noreferrer">
                      {t("common.download")}
                    </a>
                  )}
                  <DeleteButton contentType="resource" recordId={r.id} label={t("common.delete")} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
