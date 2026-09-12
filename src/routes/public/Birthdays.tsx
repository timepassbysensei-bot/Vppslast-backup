import { useTranslation } from "react-i18next";
import { Cake } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBirthdaysToday } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

export function BirthdaysPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useBirthdaysToday();

  return (
    <PageShell title={t("nav.birthdays")} heading={t("home.birthdayTitle")} path="/birthdays">
      {isLoading ? (
        <Spinner />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<Cake />}>{t("common.none")}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((b, i) => {
            const greeting = pickText(b.greeting_en, b.greeting_hi, lang).value || t("home.birthdayWish");
            return (
              <li key={i} className="card p-4 flex items-center gap-3">
                {b.photo_url ? (
                  <img src={b.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" width={64} height={64} />
                ) : (
                  <span className="h-16 w-16 rounded-full bg-amber/20 grid place-items-center text-amber" aria-hidden="true">
                    <Cake />
                  </span>
                )}
                <div>
                  <p className="font-semibold text-navy">{b.display_name}</p>
                  {b.class_code ? (
                    <p className="text-xs text-ink/60">
                      {t("common.class")} {b.class_code}
                      {b.section ? ` · ${b.section}` : ""}
                    </p>
                  ) : null}
                  <p className="text-sm text-ink/80">{greeting}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
