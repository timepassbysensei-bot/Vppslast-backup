import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";
import { Bilingual } from "@/components/Bilingual";
import { useAllHomework } from "@/hooks/principal";
import { useClasses } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { formatDate, timeUntil } from "@/lib/time";
import { publicUrl } from "@/lib/supabase";

export function AllHomework() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data, isLoading } = useAllHomework();
  const { data: classData } = useClasses();
  const [classFilter, setClassFilter] = useState("");

  const filtered = useMemo(() => (data ?? []).filter((h) => !classFilter || h.class_code === classFilter), [data, classFilter]);

  return (
    <Card>
      <SectionHeading>{t("principal.allHomework")}</SectionHeading>
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
        <EmptyState>{t("teacher.noHomework")}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((hw) => (
            <li key={hw.id} className="border border-ink/10 rounded-card p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                <span className="badge">
                  {t("common.class")} {hw.class_code}
                  {hw.section ? ` · ${hw.section}` : ""}
                </span>
                <span>{formatDate(hw.homework_date, lang)}</span>
                <span className="ml-auto text-xs">
                  {t("common.deletesInLabel")}: {timeUntil(hw.expires_at)}
                </span>
              </div>
              <Bilingual as="p" en={hw.description_en} hi={hw.description_hi} className="mt-1" />
              {hw.image_paths.length > 0 ? (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {hw.image_paths.map((p) => (
                    <img key={p} src={publicUrl("homework", p)} alt="" className="h-16 w-16 object-cover rounded-card border" />
                  ))}
                </div>
              ) : null}
              <div className="mt-2">
                <DeleteButton contentType="homework" recordId={hw.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
