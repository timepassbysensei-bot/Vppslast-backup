import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useAllClassNotices } from "@/hooks/principal";
import { useClasses } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { formatDate, timeUntil } from "@/lib/time";

export function AllClassNotices() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useAllClassNotices();
  const { data: classData } = useClasses();
  const [classFilter, setClassFilter] = useState("");

  const filtered = useMemo(() => (data ?? []).filter((n) => !classFilter || n.class_code === classFilter), [data, classFilter]);

  return (
    <Card>
      <SectionHeading>{t("principal.allClassNotices")}</SectionHeading>
      <label className="block mb-3 max-w-xs">
        <span className="field-label">{t("common.class")}</span>
        <select className="field-input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">{t("common.allClasses")}</option>
          {(classData?.classes ?? []).map((c) => (
            <option key={c.code} value={c.code}>
              {c.name_en}
            </option>
          ))}
        </select>
      </label>
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState>{t("teacher.noNotices")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((n) => (
            <li key={n.id} className="border border-ink/10 rounded-card p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                <span className="badge">
                  {t("common.class")} {n.class_code}
                  {n.section ? ` · ${n.section}` : ""}
                </span>
                <span>{formatDate(n.created_at, lang)}</span>
                <span className="ml-auto text-xs">
                  {t("common.deletesInLabel")}: {timeUntil(n.expires_at)}
                </span>
              </div>
              <Bilingual as="h3" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy mt-1" showFallbackNote={false} />
              <Bilingual as="p" en={n.content_en} hi={n.content_hi} className="text-sm text-ink/80" />
              <div className="mt-2">
                <DeleteButton contentType="class_notice" recordId={n.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
