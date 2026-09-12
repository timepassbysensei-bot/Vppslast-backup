import { useTranslation } from "react-i18next";
import { FileText, Download } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bilingual } from "@/components/Bilingual";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePublicResources } from "@/hooks/public";
import { publicUrl } from "@/lib/supabase";

export function ResourcesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = usePublicResources();

  return (
    <PageShell title={t("nav.resources")} path="/resources">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("common.none")}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((r) => {
            const url = r.public_url ?? publicUrl(r.bucket, r.path);
            return (
              <li key={r.id} className="card p-4 flex items-start gap-3">
                <FileText aria-hidden="true" className="text-navy shrink-0" />
                <div className="min-w-0">
                  <Bilingual as="h2" en={r.title_en} hi={r.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                  <Bilingual as="p" en={r.description_en} hi={r.description_hi} className="text-sm text-ink/70" />
                  {r.category || r.session ? (
                    <p className="text-xs text-ink/50 mt-1">
                      {[r.category, r.session].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <a className="btn btn-outline mt-2 px-3 py-1 text-sm" href={url} target="_blank" rel="noopener noreferrer">
                    <Download size={16} aria-hidden="true" /> {t("common.download")}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
