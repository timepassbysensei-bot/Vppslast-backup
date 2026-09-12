import type { Handler } from "@netlify/functions";
import { badRequest, ok, serverError, serviceUnavailable } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError, logInfo } from "./shared/logging";
import { serviceClient } from "./shared/supabase";
import { verifyTurnstile } from "./shared/turnstile";
import { admissionSchema } from "./shared/validation";
import { optionalEnv } from "./shared/env";
import { notifySchoolEmail } from "./shared/notify";

export const handler: Handler = async (event) => {
  const g = guard(event, { route: "submit-admission", rateLimit: { limit: 5, windowMs: 60_000 } });
  if (g.type === "response") return g.response;
  const { cors, ip } = g;

  try {
    const parsed = admissionSchema.safeParse(g.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return badRequest(first ? first.message : "Invalid request.", cors);
    }
    const input = parsed.data;

    const ts = await verifyTurnstile(input.turnstileToken, ip);
    if (!ts.configured) return serviceUnavailable("Form protection is not configured yet.", cors);
    if (!ts.ok) return badRequest("Verification failed. Please try again.", cors);

    const admin = serviceClient();

    // Respect the Asia/Kolkata admission window / mode.
    const { data: settings } = await admin
      .from("school_settings")
      .select("admission_mode, email")
      .limit(1)
      .single();
    if (!settings || settings.admission_mode !== "open") {
      return badRequest("Admissions are currently closed. Please contact the school office.", cors);
    }

    const { error } = await admin.from("admission_enquiries").insert({
      student_name: input.student_name,
      guardian_name: input.guardian_name,
      phone: input.phone,
      email: input.email ?? null,
      class_applying: input.class_applying,
      current_school: input.current_school ?? null,
      message: input.message ?? null,
      consent: input.consent,
    });
    if (error) {
      logError("submit-admission", "insert failed", { code: error.code ?? "" });
      return serverError(cors);
    }

    // Optional notification — never blocks the submission.
    const to = optionalEnv("ADMIN_NOTIFICATION_EMAIL") ?? settings.email ?? undefined;
    await notifySchoolEmail(to, "New admission enquiry", "A new admission enquiry was submitted on the website.");

    logInfo("submit-admission", "stored");
    return ok({ ok: true }, cors);
  } catch (err) {
    logError("submit-admission", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
