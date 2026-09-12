import type { Handler } from "@netlify/functions";
import { badRequest, ok, serverError, serviceUnavailable } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError, logInfo } from "./shared/logging";
import { serviceClient } from "./shared/supabase";
import { verifyTurnstile } from "./shared/turnstile";
import { parentMessageSchema } from "./shared/validation";
import { optionalEnv } from "./shared/env";
import { notifySchoolEmail } from "./shared/notify";

export const handler: Handler = async (event) => {
  const g = guard(event, { route: "submit-parent-message", rateLimit: { limit: 5, windowMs: 60_000 } });
  if (g.type === "response") return g.response;
  const { cors, ip } = g;

  try {
    const parsed = parentMessageSchema.safeParse(g.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return badRequest(first ? first.message : "Invalid request.", cors);
    }
    const input = parsed.data;

    const ts = await verifyTurnstile(input.turnstileToken, ip);
    if (!ts.configured) return serviceUnavailable("Form protection is not configured yet.", cors);
    if (!ts.ok) return badRequest("Verification failed. Please try again.", cors);

    const admin = serviceClient();

    const { error } = await admin.from("parent_messages").insert({
      student_name: input.student_name,
      sender_name: input.sender_name,
      phone: input.phone,
      class_code: input.class_code,
      section: input.section ?? null,
      message: input.message,
      consent: input.consent,
    });
    if (error) {
      logError("submit-parent-message", "insert failed", { code: error.code ?? "" });
      return serverError(cors);
    }

    const { data: settings } = await admin.from("school_settings").select("email").limit(1).single();
    const to = optionalEnv("ADMIN_NOTIFICATION_EMAIL") ?? settings?.email ?? undefined;
    await notifySchoolEmail(to, "New parent message", "A new parent/guardian message was submitted on the website.");

    logInfo("submit-parent-message", "stored");
    return ok({ ok: true }, cors);
  } catch (err) {
    logError("submit-parent-message", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
