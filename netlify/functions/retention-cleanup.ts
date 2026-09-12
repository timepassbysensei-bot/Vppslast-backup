import type { Handler, HandlerEvent } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { json, unauthorized } from "./shared/errors";
import { logError, logInfo } from "./shared/logging";
import { serviceClient } from "./shared/supabase";
import { deleteStorageObjects, type StorageEntry } from "./shared/storage";
import { optionalEnv } from "./shared/env";

const BATCH = 500;

// Allow only (a) Netlify's scheduled invocation, or (b) a request carrying the
// server-only CLEANUP_SECRET. A public HTTP hit without either is rejected.
function authorized(event: HandlerEvent): boolean {
  let isScheduled = false;
  try {
    if (event.body) {
      const parsed = JSON.parse(event.body) as { next_run?: unknown };
      isScheduled = typeof parsed.next_run === "string";
    }
  } catch {
    isScheduled = false;
  }
  const secret = optionalEnv("CLEANUP_SECRET");
  const provided = event.headers["x-cleanup-secret"] ?? event.headers["X-Cleanup-Secret"];
  if (secret && provided && provided === secret) return true;
  return isScheduled;
}

type ExpiredWithAttachment = { id: string; attachment_bucket: string | null; attachment_path: string | null };

async function cleanupHomework(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin.rpc("list_expired_homework", { p_limit: BATCH });
  if (error) throw new Error("list_homework");
  const rows = (data ?? []) as { id: string; image_paths: string[] | null }[];
  if (rows.length === 0) return 0;
  const entries: StorageEntry[] = [];
  for (const r of rows) {
    for (const p of r.image_paths ?? []) if (p) entries.push({ bucket: "homework", path: p });
  }
  await deleteStorageObjects(admin, entries);
  const { error: delErr } = await admin.rpc("delete_homework_rows", { p_ids: rows.map((r) => r.id) });
  if (delErr) throw new Error("delete_homework");
  return rows.length;
}

async function cleanupWithAttachment(
  admin: SupabaseClient,
  listFn: string,
  deleteFn: string,
): Promise<number> {
  const { data, error } = await admin.rpc(listFn, { p_limit: BATCH });
  if (error) throw new Error(`list_${listFn}`);
  const rows = (data ?? []) as ExpiredWithAttachment[];
  if (rows.length === 0) return 0;
  const entries: StorageEntry[] = [];
  for (const r of rows) {
    if (r.attachment_bucket && r.attachment_path) {
      entries.push({ bucket: r.attachment_bucket, path: r.attachment_path });
    }
  }
  await deleteStorageObjects(admin, entries);
  const { error: delErr } = await admin.rpc(deleteFn, { p_ids: rows.map((r) => r.id) });
  if (delErr) throw new Error(`delete_${deleteFn}`);
  return rows.length;
}

export const handler: Handler = async (event) => {
  if (!authorized(event)) return unauthorized();

  const admin = serviceClient();
  const counts = { homework: 0, class_notices: 0, leave_requests: 0, internal_notices: 0 };
  const errors: string[] = [];

  // Each type is independent; a failure in one does not block the others.
  try {
    counts.homework = await cleanupHomework(admin);
  } catch (err) {
    errors.push("homework");
    logError("retention-cleanup", "homework failed", { err: String(err) });
  }
  try {
    counts.class_notices = await cleanupWithAttachment(admin, "list_expired_class_notices", "delete_class_notice_rows");
  } catch (err) {
    errors.push("class_notices");
    logError("retention-cleanup", "class_notices failed", { err: String(err) });
  }
  try {
    counts.leave_requests = await cleanupWithAttachment(admin, "list_expired_leave", "delete_leave_rows");
  } catch (err) {
    errors.push("leave_requests");
    logError("retention-cleanup", "leave failed", { err: String(err) });
  }
  try {
    counts.internal_notices = await cleanupWithAttachment(admin, "list_expired_internal_notices", "delete_internal_notice_rows");
  } catch (err) {
    errors.push("internal_notices");
    logError("retention-cleanup", "internal_notices failed", { err: String(err) });
  }

  const total = counts.homework + counts.class_notices + counts.leave_requests + counts.internal_notices;
  if (total > 0 || errors.length > 0) {
    await admin.from("audit_logs").insert({
      action: "retention.cleanup",
      content_type: "retention",
      detail: { ...counts, errors },
    });
  }

  logInfo("retention-cleanup", "run complete", { total, errors: errors.join(",") });
  return json(errors.length ? 207 : 200, { ok: errors.length === 0, counts, errors });
};
