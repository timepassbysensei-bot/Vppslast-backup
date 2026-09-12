import type { Handler } from "@netlify/functions";
import { authenticate, isActiveStaff, isApprovedPrincipal } from "./shared/auth";
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError } from "./shared/logging";
import { isKnownBucket, isSafePath } from "./shared/storage";
import { signedFileSchema } from "./shared/validation";

const EXPIRES_SECONDS = 120;

export const handler: Handler = async (event) => {
  const g = guard(event, { route: "signed-file", rateLimit: { limit: 60, windowMs: 60_000 } });
  if (g.type === "response") return g.response;
  const { cors } = g;

  try {
    const caller = await authenticate(event);
    if (!caller) return unauthorized(cors);
    if (caller.role.status !== "approved") return forbidden(cors);

    const parsed = signedFileSchema.safeParse(g.body);
    if (!parsed.success) return badRequest("Invalid request.", cors);
    const { kind, record_id } = parsed.data;

    const admin = caller.admin;
    let bucket: string | null = null;
    let path: string | null = null;

    if (kind === "resource") {
      if (!isActiveStaff(caller)) return forbidden(cors);
      const { data } = await admin.from("resources").select("bucket, path").eq("id", record_id).single();
      if (!data) return notFound(cors);
      bucket = data.bucket;
      path = data.path;
    } else if (kind === "leave_attachment") {
      const { data } = await admin
        .from("teacher_leave_requests")
        .select("teacher_id, attachment_bucket, attachment_path")
        .eq("id", record_id)
        .single();
      if (!data) return notFound(cors);
      const allowed = isApprovedPrincipal(caller) || data.teacher_id === caller.user.id;
      if (!allowed) return forbidden(cors);
      bucket = data.attachment_bucket;
      path = data.attachment_path;
    } else if (kind === "internal_notice") {
      if (!isActiveStaff(caller)) return forbidden(cors);
      const { data } = await admin
        .from("internal_teacher_notices")
        .select("attachment_bucket, attachment_path, expires_at")
        .eq("id", record_id)
        .single();
      if (!data) return notFound(cors);
      // Non-principal staff cannot fetch attachments of expired notices.
      if (!isApprovedPrincipal(caller) && new Date(data.expires_at).getTime() <= Date.now()) {
        return forbidden(cors);
      }
      bucket = data.attachment_bucket;
      path = data.attachment_path;
    } else {
      // parent_attachment — principal only.
      if (!isApprovedPrincipal(caller)) return forbidden(cors);
      const { data } = await admin
        .from("parent_messages")
        .select("attachment_bucket, attachment_path")
        .eq("id", record_id)
        .single();
      if (!data) return notFound(cors);
      bucket = data.attachment_bucket;
      path = data.attachment_path;
    }

    if (!isKnownBucket(bucket) || !isSafePath(path)) return notFound(cors);

    const { data: signed, error } = await admin.storage.from(bucket).createSignedUrl(path, EXPIRES_SECONDS);
    if (error || !signed) {
      logError("signed-file", "sign failed", { kind });
      return notFound(cors);
    }

    return json(200, { url: signed.signedUrl, expires_in: EXPIRES_SECONDS }, cors);
  } catch (err) {
    logError("signed-file", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
