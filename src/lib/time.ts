import type { Lang, TimingRow } from "./types";

const TZ = "Asia/Kolkata";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type KolkataParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  weekday: number; // 0=Sun .. 6=Sat
  minutesOfDay: number;
};

// Authoritative "now" in Asia/Kolkata, independent of the device timezone.
export function kolkataParts(date: Date = new Date()): KolkataParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour") === "24" ? "0" : get("hour"));
  const minute = Number(get("minute"));

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutesOfDay: hour * 60 + minute,
  };
}

export type TodayScope = "mon_fri" | "saturday" | "sunday";

// Today's date in Asia/Kolkata as YYYY-MM-DD (for date input defaults).
export function kolkataTodayISO(parts: KolkataParts = kolkataParts()): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function todayScope(parts: KolkataParts = kolkataParts()): TodayScope {
  if (parts.weekday === 0) return "sunday";
  if (parts.weekday === 6) return "saturday";
  return "mon_fri";
}

export type TodaysTimings = {
  scope: Exclude<TodayScope, "sunday">;
  morning?: TimingRow;
  day?: TimingRow;
};

// Picks the applicable morning/day schedules for today. Returns null on Sunday
// or when no active schedule exists.
export function selectTodaysTimings(timings: TimingRow[], parts: KolkataParts = kolkataParts()): TodaysTimings | null {
  const scope = todayScope(parts);
  if (scope === "sunday") return null;
  const active = timings.filter((t) => t.is_active && t.scope === scope);
  if (active.length === 0) return null;
  return {
    scope,
    morning: active.find((t) => t.shift === "morning"),
    day: active.find((t) => t.shift === "day"),
  };
}

// "06:00:00" | "06:00" -> "6:00 AM"
export function formatTime(value: string): string {
  const [hStr, mStr] = value.split(":");
  let h = Number(hStr ?? "0");
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function todayDateLabel(lang: Lang, date: Date = new Date()): string {
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDate(value: string | null, lang: Lang): string {
  if (!value) return "";
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// Human "time remaining" until an expiry timestamp (for retention UIs).
export function timeUntil(value: string): string {
  const target = new Date(value).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return "expired";
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return `${mins} min`;
}
