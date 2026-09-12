import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { useGallery } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import type { GalleryImage } from "@/lib/types";

export function GalleryPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useGallery();
  const [active, setActive] = useState<GalleryImage | null>(null);

  return (
    <PageShell title={t("nav.gallery")} path="/gallery">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("common.none")}</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(data ?? []).map((g) => {
            const title = pickText(g.title_en, g.title_hi, lang).value;
            return (
              <li key={g.id}>
                <button type="button" className="block w-full" onClick={() => setActive(g)} aria-label={title || t("nav.gallery")}>
                  <img
                    src={g.public_url ?? ""}
                    alt={title}
                    className="w-full h-32 sm:h-40 object-cover rounded-card border"
                    loading="lazy"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(active)} onClose={() => setActive(null)} title={active ? pickText(active.title_en, active.title_hi, lang).value || t("nav.gallery") : t("nav.gallery")}>
        {active ? <img src={active.public_url ?? ""} alt={pickText(active.title_en, active.title_hi, lang).value} className="w-full rounded-card" /> : null}
      </Dialog>
    </PageShell>
  );
}
