import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useTimings } from "@/hooks/public";
import { useSaveTimings } from "@/hooks/principal";
import type { TimingRow } from "@/lib/types";

type Key = "mon_fri-morning" | "mon_fri-day" | "saturday-morning" | "saturday-day";
const ORDER: { key: Key; scope: "mon_fri" | "saturday"; shift: "morning" | "day"; labelKey: string }[] = [
  { key: "mon_fri-morning", scope: "mon_fri", shift: "morning", labelKey: "principal.monFri" },
  { key: "mon_fri-day", scope: "mon_fri", shift: "day", labelKey: "principal.monFri" },
  { key: "saturday-morning", scope: "saturday", shift: "morning", labelKey: "principal.saturday" },
  { key: "saturday-day", scope: "saturday", shift: "day", labelKey: "principal.saturday" },
];

function hhmm(v: string): string {
  return v.slice(0, 5);
}

export function TimingManager() {
  const { t } = useTranslation();
  const { data, isLoading } = useTimings();
  const save = useSaveTimings();
  const [rows, setRows] = useState<Record<string, { id: string; start: string; end: string }>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, { id: string; start: string; end: string }> = {};
    for (const o of ORDER) {
      const found = data.find((r: TimingRow) => r.scope === o.scope && r.shift === o.shift);
      if (found) next[o.key] = { id: found.id, start: hhmm(found.start_time), end: hhmm(found.end_time) };
    }
    setRows(next);
  }, [data]);

  async function submit(): Promise<void> {
    setMsg(null);
    const payload = Object.values(rows).map((r) => ({ id: r.id, start_time: r.start, end_time: r.end }));
    await save.mutateAsync(payload);
    setMsg(t("principal.timingsSaved"));
  }

  if (isLoading) return <Card><Spinner /></Card>;

  return (
    <Card>
      <SectionHeading>{t("principal.timingManager")}</SectionHeading>
      <div className="grid gap-3">
        {ORDER.map((o) => {
          const row = rows[o.key];
          if (!row) return null;
          const label = `${t(o.labelKey)} — ${o.shift === "morning" ? t("home.morningShift") : t("home.dayShift")}`;
          return (
            <div key={o.key} className="border border-ink/10 rounded-card p-3">
              <p className="font-semibold text-navy mb-2">{label}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">{o.shift === "morning" ? t("principal.morningStart") : t("principal.dayStart")}</span>
                  <input
                    type="time"
                    className="field-input"
                    value={row.start}
                    onChange={(e) => setRows((s) => ({ ...s, [o.key]: { ...row, start: e.target.value } }))}
                  />
                </label>
                <label className="block">
                  <span className="field-label">{o.shift === "morning" ? t("principal.morningEnd") : t("principal.dayEnd")}</span>
                  <input
                    type="time"
                    className="field-input"
                    value={row.end}
                    onChange={(e) => setRows((s) => ({ ...s, [o.key]: { ...row, end: e.target.value } }))}
                  />
                </label>
              </div>
            </div>
          );
        })}
        {msg ? <StatusMessage kind="success">{msg}</StatusMessage> : null}
        <div>
          <Button disabled={save.isPending} onClick={() => void submit()}>
            {t("principal.saveTimings")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
