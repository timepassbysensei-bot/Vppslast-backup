import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClasses, useClassContent } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { publicUrl } from "@/lib/supabase";
import { formatDate } from "@/lib/time";
import { Bilingual } from "@/components/Bilingual";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

type Mode = "both" | "homework" | "notices";

export function ClassContent({ mode = "both" }: { mode?: Mode }) {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: classData } = useClasses();
  const [classCode, setClassCode] = useState<string>("");
  const [section, setSection] = useState<string>("");

  const classes = classData?.classes ?? [];
  const selectedClass = classes.find((c) => c.code === classCode) ?? null;
  const sections = useMemo(
    () => (classData?.sections ?? []).filter((s) => s.class_code === classCode),
    [classData, classCode],
  );

  const { data, isLoading, isError, refetch } = useClassContent(classCode || null, section || null);

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{t("common.class")}</span>
          <select
            className="field-input"
            value={classCode}
            onChange={(e) => {
              setClassCode(e.target.value);
              setSection("");
            }}
          >
            <option value="">{t("common.selectClass")}</option>
            {classes.map((c) => (
              <option key={c.code} value={c.code}>
                {pickText(c.name_en, c.name_hi, lang).value}
              </option>
            ))}
          </select>
        </label>
        {selectedClass?.requires_section ? (
          <label className="block">
            <span className="field-label">{t("common.section")}</span>
            <select className="field-input" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">{t("common.allSections")}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {!classCode ? (
        <EmptyState>{t("classView.choose")}</EmptyState>
      ) : isLoading ? (
        <Spinner />
      ) : isError ? (
        <div className="card p-4">
          <p className="mb-2">{t("common.error")}</p>
          <button className="btn btn-outline" onClick={() => void refetch()}>
            {t("common.retry")}
          </button>
        </div>
      ) : (
        <>
          {mode !== "notices" ? (
            <section aria-labelledby="cc-hw">
              <h2 id="cc-hw" className="text-lg font-bold mb-2">
                {t("classView.homeworkHeading")}
              </h2>
              {(data?.homework ?? []).length === 0 ? (
                <EmptyState>{t("classView.noHomework")}</EmptyState>
              ) : (
                <ul className="grid gap-3">
                  {(data?.homework ?? []).map((hw) => (
                    <li key={hw.id} className="card p-4">
                      <p className="text-xs text-ink/60">
                        {formatDate(hw.homework_date, lang)}
                        {hw.section ? ` · ${t("common.section")} ${hw.section}` : ""}
                      </p>
                      <Bilingual as="p" en={hw.description_en} hi={hw.description_hi} className="mt-1" />
                      {hw.image_paths.length > 0 ? (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {hw.image_paths.map((p) => (
                            <img
                              key={p}
                              src={publicUrl("homework", p)}
                              alt=""
                              className="h-24 w-24 object-cover rounded-card border"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {mode !== "homework" ? (
            <section aria-labelledby="cc-notices">
              <h2 id="cc-notices" className="text-lg font-bold mb-2">
                {t("classView.noticesHeading")}
              </h2>
              {(data?.notices ?? []).length === 0 ? (
                <EmptyState>{t("classView.noNotices")}</EmptyState>
              ) : (
                <ul className="grid gap-3">
                  {(data?.notices ?? []).map((n) => (
                    <li key={n.id} className="card p-4">
                      <Bilingual as="h3" en={n.title_en} hi={n.title_hi} className="font-semibold text-navy" showFallbackNote={false} />
                      <Bilingual as="p" en={n.content_en} hi={n.content_hi} className="text-sm text-ink/80 mt-1" />
                      <p className="text-xs text-ink/50 mt-1">{formatDate(n.created_at, lang)}</p>
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
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
