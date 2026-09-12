import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { Bilingual } from "@/components/Bilingual";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePublicNotices } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { publicUrl } from "@/lib/supabase";
import { formatDate } from "@/lib/time";

export function Notices() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = usePublicNotices();

  return (
    <PageShell title={t("nav.notices")} path="/notices">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("teacher.noNotices")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((n) => (
            <li key={n.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                {n.pinned ? <span className="badge">★</span> : null}
                {n.urgent ? <span className="badge text-danger border-danger/40">{t("common.priority")}</span> : null}
                <Bilingual as="h2" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy text-lg" showFallbackNote={false} />
              </div>
              <Bilingual as="p" en={n.summary_en} hi={n.summary_hi} className="text-ink/70 mt-1" showFallbackNote={false} />
              <Bilingual as="p" en={n.content_en} hi={n.content_hi} className="text-ink/80 mt-2 whitespace-pre-line" />
              <p className="text-xs text-ink/50 mt-2">{formatDate(n.effective_at, lang)}</p>
              {n.attachment_bucket && n.attachment_path ? (
                <a
                  className="text-navy-600 underline text-sm mt-1 inline-block"
                  href={publicUrl(n.attachment_bucket, n.attachment_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("common.attachment")}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
