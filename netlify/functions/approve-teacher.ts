import type { Handler } from "@netlify/functions";
import { authenticate, isApprovedPrincipal } from "./shared/auth";
import { forbidden, ok, serverError, unauthorized, badRequest } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError, logInfo } from "./shared/logging";
import { approveTeacherSchema } from "./shared/validation";

export const handler: Handler = async (event) => {
  const g = guard(event, { route: "approve-teacher", rateLimit: { limit: 30, windowMs: 60_000 } });
  if (g.type === "response") return g.response;
  const { cors } = g;

  try {
    const caller = await authenticate(event);
    if (!caller) return unauthorized(cors);
    if (!isApprovedPrincipal(caller)) return forbidden(cors);

    const parsed = approveTeacherSchema.safeParse(g.body);
    if (!parsed.success) return badRequest("Invalid request.", cors);
    const { target_user_id, action } = parsed.data;

    const admin = caller.admin;

    // Confirm the target exists.
    const { data: target, error: targetErr } = await admin
      .from("user_roles")
      .select("user_id, role, status")
      .eq("user_id", target_user_id)
      .single();
    if (targetErr || !target) return badRequest("Unknown user.", cors);

    // A principal may never suspend or reject their own active account.
    if (target_user_id === caller.user.id && (action === "suspend" || action === "reject")) {
      return badRequest("You cannot suspend or reject your own account.", cors);
    }

    const patch: Record<string, unknown> = {};
    if (action === "approve") {
      patch.status = "approved";
      patch.approved_by = caller.user.id;
      patch.approved_at = new Date().toISOString();
    } else if (action === "reject") {
      patch.status = "rejected";
      patch.approved_by = null;
      patch.approved_at = null;
    } else {
      patch.status = "suspended";
    }

    const { error: updErr } = await admin.from("user_roles").update(patch).eq("user_id", target_user_id);
    if (updErr) {
      logError("approve-teacher", "update failed", { code: updErr.code ?? "" });
      return serverError(cors);
    }

    await admin.from("audit_logs").insert({
      actor_id: caller.user.id,
      actor_role: caller.role.role,
      action: `staff.${action}`,
      content_type: "user_roles",
      record_id: target_user_id,
      detail: { action },
    });

    logInfo("approve-teacher", "status changed", { action });
    return ok({ ok: true, action }, cors);
  } catch (err) {
    logError("approve-teacher", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
