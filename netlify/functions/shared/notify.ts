import { optionalEnv } from "./env";
import { logError, logInfo } from "./logging";

const RESEND_URL = "https://api.resend.com/emails";

// Optional Resend notification. Never throws and never blocks the caller's
// primary operation. If Resend is not configured, it is a no-op.
export async function notifySchoolEmail(
  to: string | undefined,
  subject: string,
  text: string,
): Promise<void> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from || !to) {
    logInfo("notify", "resend not configured; skipping notification");
    return;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      logError("notify", "resend responded with error", { status: res.status });
    }
  } catch (err) {
    logError("notify", "resend request failed", { err: String(err) });
  }
}
