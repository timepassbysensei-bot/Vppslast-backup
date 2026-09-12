import { optionalEnv } from "./env";
import { logError } from "./logging";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { ok: boolean; configured: boolean };

// Verifies a Cloudflare Turnstile token server-side. Fails closed: if the
// secret is not configured or verification fails, `ok` is false.
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<TurnstileResult> {
  const secret = optionalEnv("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return { ok: false, configured: false };
  }
  if (!token) {
    return { ok: false, configured: true };
  }
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (ip && ip !== "unknown") form.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = (await res.json()) as { success?: boolean };
    return { ok: data.success === true, configured: true };
  } catch (err) {
    logError("turnstile", "verification request failed", { err: String(err) });
    return { ok: false, configured: true };
  }
}
