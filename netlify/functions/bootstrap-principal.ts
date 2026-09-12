import type { Handler } from "@netlify/functions";
import { badRequest, forbidden, ok, serverError, serviceUnavailable } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError, logInfo } from "./shared/logging";
import { serviceClient } from "./shared/supabase";
import { optionalEnv } from "./shared/env";
import { bootstrapSchema } from "./shared/validation";

// One-time promotion of the master principal. Gated by BOOTSTRAP_SECRET and
// only ever acts on ADMIN_BOOTSTRAP_EMAIL from the server environment. It never
// trusts any email supplied by the browser. Disable/remove after first success.
export const handler: Handler = async (event) => {
  const g = guard(event, { route: "bootstrap-principal", rateLimit: { limit: 5, windowMs: 300_000 } });
  if (g.type === "response") return g.response;
  const { cors } = g;

  try {
    const secret = optionalEnv("BOOTSTRAP_SECRET");
    const email = optionalEnv("ADMIN_BOOTSTRAP_EMAIL");
    if (!secret || !email) {
      return serviceUnavailable("Bootstrap is not configured.", cors);
    }

    const parsed = bootstrapSchema.safeParse(g.body);
    if (!parsed.success) return badRequest("Invalid request.", cors);
    if (parsed.data.secret !== secret) return forbidden(cors);

    const admin = serviceClient();

    // Resolve the id from the verified email recorded at signup.
    const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!profile) {
      logInfo("bootstrap-principal", "target account not found yet");
      return ok({ ok: true, promoted: false }, cors);
    }

    const { error: updErr } = await admin
      .from("user_roles")
      .update({
        role: "principal",
        status: "approved",
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", profile.id);
    if (updErr) {
      logError("bootstrap-principal", "update failed", { code: updErr.code ?? "" });
      return serverError(cors);
    }

    await admin.from("audit_logs").insert({
      actor_id: profile.id,
      actor_role: "principal",
      action: "principal.bootstrap",
      content_type: "user_roles",
      record_id: profile.id,
      detail: { bootstrap: true },
    });

    logInfo("bootstrap-principal", "promoted principal");
    return ok({ ok: true, promoted: true }, cors);
  } catch (err) {
    logError("bootstrap-principal", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
