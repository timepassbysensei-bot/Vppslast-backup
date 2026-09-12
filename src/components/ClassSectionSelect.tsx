import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useClasses } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";

export type ClassSelection = { classCode: string; section: string };

export function ClassSectionSelect({
  value,
  onChange,
}: {
  value: ClassSelection;
  onChange: (next: ClassSelection) => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const { data } = useClasses();
  const classes = data?.classes ?? [];
  const selected = classes.find((c) => c.code === value.classCode) ?? null;
  const sections = useMemo(
    () => (data?.sections ?? []).filter((s) => s.class_code === value.classCode),
    [data, value.classCode],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="field-label">{t("common.class")}</span>
        <select
          className="field-input"
          value={value.classCode}
          onChange={(e) => onChange({ classCode: e.target.value, section: "" })}
        >
          <option value="">{t("common.selectClass")}</option>
          {classes.map((c) => (
            <option key={c.code} value={c.code}>
              {pickText(c.name_en, c.name_hi, lang).value}
            </option>
          ))}
        </select>
      </label>
      {selected?.requires_section ? (
        <label className="block">
          <span className="field-label">{t("common.section")}</span>
          <select className="field-input" value={value.section} onChange={(e) => onChange({ ...value, section: e.target.value })}>
            <option value="">{t("common.selectSection")}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
