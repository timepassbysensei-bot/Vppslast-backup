import { supabase } from "./supabase";

const IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const DOC_MIME: Record<string, string> = {
  "application/pdf": "pdf",
};

export type UploadKind = "image" | "image_or_pdf";

export function allowedExtension(mime: string, kind: UploadKind): string | null {
  if (IMAGE_MIME[mime]) return IMAGE_MIME[mime];
  if (kind === "image_or_pdf" && DOC_MIME[mime]) return DOC_MIME[mime];
  return null;
}

// Never trusts the device filename. Generates a random, extension-validated
// object key inside the caller's owner folder: `{uid}/{uuid}.{ext}`.
export function safeObjectPath(uid: string, mime: string, kind: UploadKind): string | null {
  const ext = allowedExtension(mime, kind);
  if (!ext) return null;
  return `${uid}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadFile(
  bucket: string,
  uid: string,
  file: File,
  kind: UploadKind = "image",
): Promise<string> {
  const path = safeObjectPath(uid, file.type, kind);
  if (!path) {
    throw new Error("unsupported_file_type");
  }
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
