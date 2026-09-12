import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { Bilingual } from "@/components/Bilingual";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAllEvents } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/time";
import { MapPin } from "lucide-react";

export function CalendarPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useAllEvents();

  return (
    <PageShell title={t("nav.calendar")} path="/calendar">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState>{t("common.none")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((e) => (
            <li key={e.id} className="card p-4">
              <p className="text-sm font-semibold text-amber">
                {formatDate(e.start_date, lang)}
                {e.end_date ? ` – ${formatDate(e.end_date, lang)}` : ""}
              </p>
              <Bilingual as="h2" en={e.title_en} hi={e.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
              <Bilingual as="p" en={e.description_en} hi={e.description_hi} className="text-ink/80 mt-1" />
              {e.location_en ? (
                <p className="text-sm text-ink/60 mt-1 flex items-center gap-1">
                  <MapPin size={14} aria-hidden="true" />
                  <Bilingual en={e.location_en} hi={e.location_hi} showFallbackNote={false} />
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
