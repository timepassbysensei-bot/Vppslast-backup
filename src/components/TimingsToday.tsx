import { useTranslation } from "react-i18next";
import { Clock, Sun, CloudSun } from "lucide-react";
import { useTimings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { formatTime, kolkataParts, selectTodaysTimings, todayDateLabel, todayScope } from "@/lib/time";
import type { TimingRow } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";

function ShiftCard({ label, icon, timing }: { label: string; icon: React.ReactNode; timing: TimingRow }) {
  const { t } = useTranslation();
  const lang = useLang();
  const classes = pickText(timing.classes_en, timing.classes_hi, lang).value;
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 font-semibold text-navy">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg mt-1">
        {formatTime(timing.start_time)} – {formatTime(timing.end_time)}
      </p>
      {classes ? (
        <p className="text-sm text-ink/70 mt-1">
          <span className="font-medium">{t("home.classesLabel")}: </span>
          {classes}
        </p>
      ) : null}
    </div>
  );
}

export function TimingsToday() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: timings, isLoading } = useTimings();
  const parts = kolkataParts();
  const scope = todayScope(parts);
  const today = selectTodaysTimings(timings ?? [], parts);

  return (
    <section aria-labelledby="timings-heading">
      <h2 id="timings-heading" className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
        <Clock aria-hidden="true" /> {t("home.todaysTimings")}
      </h2>
      <p className="text-sm text-ink/60 mb-3">
        {t("home.todayIs")} {todayDateLabel(lang)}
      </p>
      {isLoading ? (
        <Spinner />
      ) : scope === "sunday" ? (
        <div className="card p-4">{t("home.sundayMessage")}</div>
      ) : !today || (!today.morning && !today.day) ? (
        <div className="card p-4">{t("home.noSchedule")}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {today.morning ? (
            <ShiftCard label={t("home.morningShift")} icon={<Sun aria-hidden="true" size={18} />} timing={today.morning} />
          ) : null}
          {today.day ? (
            <ShiftCard label={t("home.dayShift")} icon={<CloudSun aria-hidden="true" size={18} />} timing={today.day} />
          ) : null}
        </div>
      )}
    </section>
  );
}
