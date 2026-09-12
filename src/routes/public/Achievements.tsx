import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { Bilingual } from "@/components/Bilingual";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAchievements } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { publicUrl } from "@/lib/supabase";
import { formatDate } from "@/lib/time";

export function AchievementsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useAchievements();

  return (
    <PageShell title={t("nav.achievements")} path="/achievements">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("common.none")}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((a) => {
            const img = a.image_url ?? (a.image_bucket && a.image_path ? publicUrl(a.image_bucket, a.image_path) : null);
            return (
              <li key={a.id} className="card p-4">
                {img ? <img src={img} alt="" className="w-full h-40 object-cover rounded-card mb-2" loading="lazy" /> : null}
                <Bilingual as="h2" en={a.title_en} hi={a.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                {a.event_date ? <p className="text-xs text-ink/50">{formatDate(a.event_date, lang)}</p> : null}
                <Bilingual as="p" en={a.description_en} hi={a.description_hi} className="text-ink/80 mt-1" />
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
