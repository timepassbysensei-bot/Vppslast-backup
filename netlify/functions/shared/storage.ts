import type { SupabaseClient } from "@supabase/supabase-js";

export const KNOWN_BUCKETS = [
  "branding",
  "notices",
  "homework",
  "gallery",
  "spotlight",
  "resources-public",
  "birthday",
  "resources-private",
  "parent-attachments",
  "leave-attachments",
  "internal-notices",
] as const;

export type KnownBucket = (typeof KNOWN_BUCKETS)[number];

export type StorageEntry = { bucket: string; path: string };

export function isKnownBucket(bucket: string | null | undefined): bucket is KnownBucket {
  return !!bucket && (KNOWN_BUCKETS as readonly string[]).includes(bucket);
}

// Reject traversal and absolute paths. Storage keys are relative within a bucket.
export function isSafePath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.length > 1024) return false;
  return true;
}

// Only accepts (bucket, path) pairs that pass validation. Anything unexpected
// is dropped so the browser can never point deletion at an arbitrary object.
export function validEntries(entries: StorageEntry[]): StorageEntry[] {
  return entries.filter((e) => isKnownBucket(e.bucket) && isSafePath(e.path));
}

// Deletes objects grouped per bucket. Idempotent: Supabase treats already-missing
// keys as success. Throws on a real storage failure so callers can report a
// generic error and safely retry.
export async function deleteStorageObjects(admin: SupabaseClient, entries: StorageEntry[]): Promise<void> {
  const safe = validEntries(entries);
  if (safe.length === 0) return;

  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of safe) {
    const list = byBucket.get(bucket) ?? [];
    list.push(path);
    byBucket.set(bucket, list);
  }

  for (const [bucket, paths] of byBucket) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(`storage_delete_failed:${bucket}`);
    }
  }
}
