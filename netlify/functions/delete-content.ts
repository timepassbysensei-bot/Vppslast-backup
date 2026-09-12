import type { Handler } from "@netlify/functions";
import { authenticate, isActiveStaff, isApprovedPrincipal, type AuthedCaller } from "./shared/auth";
import { badRequest, forbidden, ok, serverError, unauthorized } from "./shared/errors";
import { guard } from "./shared/guard";
import { logError, logInfo } from "./shared/logging";
import { deleteStorageObjects, type StorageEntry } from "./shared/storage";
import { deleteContentSchema, type DeleteContentInput } from "./shared/validation";

type Row = Record<string, unknown>;

type ContentSpec = {
  table: string;
  ownerColumn: string | null; // null => principal-only content
  role: "teacher_or_principal" | "principal";
  select: string;
  files: (row: Row) => StorageEntry[];
  audit: string;
};

function str(row: Row, key: string): string | null {
  const v = row[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function attachment(row: Row, bucketKey: string, pathKey: string): StorageEntry[] {
  const bucket = str(row, bucketKey);
  const path = str(row, pathKey);
  return bucket && path ? [{ bucket, path }] : [];
}

const REGISTRY: Record<DeleteContentInput["content_type"], ContentSpec> = {
  homework: {
    table: "homework_uploads",
    ownerColumn: "created_by",
    role: "teacher_or_principal",
    select: "id, created_by, image_paths",
    files: (row) => {
      const paths = Array.isArray(row.image_paths) ? (row.image_paths as unknown[]) : [];
      return paths
        .filter((p): p is string => typeof p === "string" && p.length > 0)
        .map((p) => ({ bucket: "homework", path: p }));
    },
    audit: "homework.delete",
  },
  class_notice: {
    table: "class_notices",
    ownerColumn: "created_by",
    role: "teacher_or_principal",
    select: "id, created_by, attachment_bucket, attachment_path",
    files: (row) => attachment(row, "attachment_bucket", "attachment_path"),
    audit: "class_notice.delete",
  },
  public_notice: {
    table: "public_notices",
    ownerColumn: null,
    role: "principal",
    select: "id, attachment_bucket, attachment_path",
    files: (row) => attachment(row, "attachment_bucket", "attachment_path"),
    audit: "public_notice.delete",
  },
  spotlight: {
    table: "student_spotlights",
    ownerColumn: "created_by",
    role: "teacher_or_principal",
    select: "id, created_by, photo_bucket, photo_path",
    files: (row) => attachment(row, "photo_bucket", "photo_path"),
    audit: "spotlight.delete",
  },
  birthday: {
    table: "birthday_profiles",
    ownerColumn: "created_by",
    role: "teacher_or_principal",
    select: "id, created_by, photo_bucket, photo_path",
    files: (row) => attachment(row, "photo_bucket", "photo_path"),
    audit: "birthday.delete",
  },
  gallery_image: {
    table: "gallery_images",
    ownerColumn: null,
    role: "principal",
    select: "id, bucket, path",
    files: (row) => attachment(row, "bucket", "path"),
    audit: "gallery.delete",
  },
  resource: {
    table: "resources",
    ownerColumn: null,
    role: "principal",
    select: "id, bucket, path",
    files: (row) => attachment(row, "bucket", "path"),
    audit: "resource.delete",
  },
  calendar_event: {
    table: "calendar_events",
    ownerColumn: null,
    role: "principal",
    select: "id",
    files: () => [],
    audit: "calendar.delete",
  },
  achievement: {
    table: "achievements",
    ownerColumn: null,
    role: "principal",
    select: "id, image_bucket, image_path",
    files: (row) => attachment(row, "image_bucket", "image_path"),
    audit: "achievement.delete",
  },
  internal_notice: {
    table: "internal_teacher_notices",
    ownerColumn: null,
    role: "principal",
    select: "id, attachment_bucket, attachment_path",
    files: (row) => attachment(row, "attachment_bucket", "attachment_path"),
    audit: "internal_notice.delete",
  },
  leave_request: {
    table: "teacher_leave_requests",
    ownerColumn: "teacher_id",
    role: "teacher_or_principal",
    select: "id, teacher_id, attachment_bucket, attachment_path",
    files: (row) => attachment(row, "attachment_bucket", "attachment_path"),
    audit: "leave_request.delete",
  },
  parent_message: {
    table: "parent_messages",
    ownerColumn: null,
    role: "principal",
    select: "id, attachment_bucket, attachment_path",
    files: (row) => attachment(row, "attachment_bucket", "attachment_path"),
    audit: "parent_message.delete",
  },
  admission_enquiry: {
    table: "admission_enquiries",
    ownerColumn: null,
    role: "principal",
    select: "id",
    files: () => [],
    audit: "admission_enquiry.delete",
  },
};

function authorize(caller: AuthedCaller, spec: ContentSpec, row: Row): boolean {
  if (isApprovedPrincipal(caller)) return true; // principal may delete anything allowlisted
  if (spec.role === "principal") return false;
  if (!isActiveStaff(caller)) return false;
  if (!spec.ownerColumn) return false;
  return str(row, spec.ownerColumn) === caller.user.id;
}

export const handler: Handler = async (event) => {
  const g = guard(event, { route: "delete-content", rateLimit: { limit: 60, windowMs: 60_000 } });
  if (g.type === "response") return g.response;
  const { cors } = g;

  try {
    const caller = await authenticate(event);
    if (!caller) return unauthorized(cors);
    if (caller.role.status !== "approved") return forbidden(cors);

    const parsed = deleteContentSchema.safeParse(g.body);
    if (!parsed.success) return badRequest("Invalid request.", cors);
    const { content_type, record_id } = parsed.data;
    const spec = REGISTRY[content_type];

    const admin = caller.admin;
    const { data: row, error } = await admin.from(spec.table).select(spec.select).eq("id", record_id).maybeSingle();
    if (error) {
      logError("delete-content", "load failed", { content_type, code: error.code ?? "" });
      return serverError(cors);
    }
    if (!row) {
      // Already gone — idempotent success.
      return ok({ ok: true, already_deleted: true }, cors);
    }

    const typedRow = row as unknown as Row;
    if (!authorize(caller, spec, typedRow)) return forbidden(cors);

    // 1) Delete associated storage first (idempotent). 2) Delete the row.
    try {
      await deleteStorageObjects(admin, spec.files(typedRow));
    } catch (storageErr) {
      logError("delete-content", "storage delete failed", { content_type, err: String(storageErr) });
      return serverError(cors); // generic failure; safe to retry
    }

    const { error: delErr } = await admin.from(spec.table).delete().eq("id", record_id);
    if (delErr) {
      logError("delete-content", "row delete failed", { content_type, code: delErr.code ?? "" });
      return serverError(cors);
    }

    await admin.from("audit_logs").insert({
      actor_id: caller.user.id,
      actor_role: caller.role.role,
      action: spec.audit,
      content_type,
      record_id,
      detail: { manual: true },
    });

    logInfo("delete-content", "deleted", { content_type });
    return ok({ ok: true }, cors);
  } catch (err) {
    logError("delete-content", "unhandled", { err: String(err) });
    return serverError(cors);
  }
};
