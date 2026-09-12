import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { useGalleryAdmin, useUploadGallery, useToggleGalleryPublish } from "@/hooks/principal";

export function GalleryManager() {
  const { t } = useTranslation();
  const upload = useUploadGallery();
  const toggle = useToggleGalleryPublish();
  const { data, isLoading } = useGalleryAdmin();

  const [file, setFile] = useState<File | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleHi, setTitleHi] = useState("");
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!file) {
      setError(t("common.error"));
      return;
    }
    try {
      await upload.mutateAsync({ file, title_en: titleEn.trim() || null, title_hi: titleHi.trim() || null, sort_order: order });
      setSuccess(true);
      setFile(null);
      setTitleEn("");
      setTitleHi("");
    } catch {
      setError(t("common.error"));
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <SectionHeading>{t("principal.gallery")}</SectionHeading>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <label className="block">
            <span className="field-label">{t("principal.uploadImage")}</span>
            <input type="file" accept="image/*" className="field-input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <TextInput label={t("teacher.titleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          <TextInput label={t("teacher.titleHi")} value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
          <TextInput label={t("principal.displayOrder")} type="number" value={String(order)} onChange={(e) => setOrder(Number(e.target.value))} />
          {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {success ? <StatusMessage kind="success">{t("principal.galleryUploaded")}</StatusMessage> : null}
          <div>
            <Button type="submit" disabled={upload.isPending}>
              {t("principal.uploadImage")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeading>{t("principal.gallery")}</SectionHeading>
        {isLoading ? (
          <Spinner />
        ) : (data ?? []).length === 0 ? (
          <EmptyState>{t("common.none")}</EmptyState>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(data ?? []).map((g) => (
              <li key={g.id} className="border border-ink/10 rounded-card p-2">
                <img src={g.public_url ?? ""} alt={g.title_en ?? ""} className="w-full h-28 object-cover rounded-card" />
                <div className="mt-2 flex flex-col gap-1">
                  <span className={`badge ${g.is_published ? "text-success border-success/40" : ""}`}>
                    {g.is_published ? t("principal.published") : t("principal.unpublished")}
                  </span>
                  <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => toggle.mutate({ id: g.id, is_published: !g.is_published })}>
                    {g.is_published ? t("principal.unpublish") : t("principal.publish")}
                  </Button>
                  <DeleteButton contentType="gallery_image" recordId={g.id} label={t("common.delete")} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
