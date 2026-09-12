import { describe, it, expect } from "vitest";
import { formatTime, selectTodaysTimings, timeUntil, todayScope, type KolkataParts } from "@/lib/time";
import type { TimingRow } from "@/lib/types";

const timings: TimingRow[] = [
  { id: "1", scope: "mon_fri", shift: "morning", start_time: "06:00:00", end_time: "10:00:00", classes_en: "A", classes_hi: null, is_active: true },
  { id: "2", scope: "mon_fri", shift: "day", start_time: "10:10:00", end_time: "15:00:00", classes_en: "B", classes_hi: null, is_active: true },
  { id: "3", scope: "saturday", shift: "morning", start_time: "06:00:00", end_time: "08:30:00", classes_en: "A", classes_hi: null, is_active: true },
  { id: "4", scope: "saturday", shift: "day", start_time: "10:10:00", end_time: "13:00:00", classes_en: "B", classes_hi: null, is_active: true },
];

function parts(weekday: number): KolkataParts {
  return { year: 2026, month: 8, day: 10, weekday, minutesOfDay: 400 };
}

describe("formatTime", () => {
  it("formats 24h to 12h with meridiem", () => {
    expect(formatTime("06:00:00")).toBe("6:00 AM");
    expect(formatTime("15:00")).toBe("3:00 PM");
    expect(formatTime("00:30")).toBe("12:30 AM");
    expect(formatTime("12:05")).toBe("12:05 PM");
  });
});

describe("todayScope", () => {
  it("maps weekdays to scopes", () => {
    expect(todayScope(parts(0))).toBe("sunday");
    expect(todayScope(parts(6))).toBe("saturday");
    expect(todayScope(parts(3))).toBe("mon_fri");
  });
});

describe("selectTodaysTimings", () => {
  it("returns null on Sunday", () => {
    expect(selectTodaysTimings(timings, parts(0))).toBeNull();
  });

  it("selects weekday morning + day", () => {
    const today = selectTodaysTimings(timings, parts(2));
    expect(today?.scope).toBe("mon_fri");
    expect(today?.morning?.start_time).toBe("06:00:00");
    expect(today?.day?.end_time).toBe("15:00:00");
  });

  it("selects Saturday schedule", () => {
    const today = selectTodaysTimings(timings, parts(6));
    expect(today?.scope).toBe("saturday");
    expect(today?.day?.end_time).toBe("13:00:00");
  });

  it("returns null when no active schedule exists", () => {
    expect(selectTodaysTimings([], parts(2))).toBeNull();
  });
});

describe("timeUntil (retention countdown)", () => {
  it("reports days remaining", () => {
    const future = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    expect(timeUntil(future)).toBe("3 days");
  });
  it("reports expired for past timestamps", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(timeUntil(past)).toBe("expired");
  });
});
