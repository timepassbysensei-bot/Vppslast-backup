import type { Handler } from "@netlify/functions";
import { json, serverError } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError } from "./shared/logging";
import { serviceClient } from "./shared/supabase";

type BirthdayRow = {
  student_name: string;
  class_code: string | null;
  section: string | null;
  dob: string;
  photo_bucket: string | null;
  photo_path: string | null;
  greeting_en: string | null;
  greeting_hi: string | null;
  publish_mode: "text_only" | "with_photo" | "not_public";
  is_active: boolean;
};

// Today's month/day in Asia/Kolkata (authoritative, not the device clock).
function kolkataMonthDay(): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "0");
  return { month, day };
}

export const handler: Handler = async (event) => {
  const g = guard(event, {
    route: "birthdays-today",
    method: "GET",
    requireJson: false,
    rateLimit: { limit: 60, windowMs: 60_000 },
  });
  if (g.type === "response") return g.response;
  const noStore = { ...g.cors, "Cache-Control": "no-store" };

  try {
    const admin = serviceClient();
    const { month, day } = kolkataMonthDay();

    const { data, error } = await admin
      .from("birthday_profiles")
      .select("student_name, class_code, section, dob, photo_bucket, photo_path, greeting_en, greeting_hi, publish_mode, is_active")
      .eq("is_active", true)
      .neq("publish_mode", "not_public");

    if (error) {
      logError("birthdays-today", "query failed", { code: error.code ?? "" });
      return serverError(noStore);
    }

    const rows = (data ?? []) as BirthdayRow[];
    const todays = rows.filter((r) => {
      // dob is YYYY-MM-DD. Compare month/day only — never expose the year.
      const m = Number(r.dob.slice(5, 7));
      const d = Number(r.dob.slice(8, 10));
      return m === month && d === day;
    });

    const result = todays.map((r) => {
      let photo_url: string | null = null;
      if (r.publish_mode === "with_photo" && r.photo_path) {
        const bucket = r.photo_bucket ?? "birthday";
        photo_url = admin.storage.from(bucket).getPublicUrl(r.photo_path).data.publicUrl;
      }
      return {
        display_name: r.student_name,
        class_code: r.class_code,
        section: r.section,
        greeting_en: r.greeting_en,
        greeting_hi: r.greeting_hi,
        photo_url,
      };
    });

    return json(200, { birthdays: result }, noStore);
  } catch (err) {
    logError("birthdays-today", "unhandled", { err: String(err) });
    return serverError(noStore);
  }
};
