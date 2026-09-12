import { describe, it, expect } from "vitest";
import { isKnownBucket, isSafePath, validEntries } from "../../netlify/functions/shared/storage";

describe("storage path validation (prevents arbitrary bucket/path deletion)", () => {
  it("accepts only known buckets", () => {
    expect(isKnownBucket("homework")).toBe(true);
    expect(isKnownBucket("leave-attachments")).toBe(true);
    expect(isKnownBucket("evil-bucket")).toBe(false);
    expect(isKnownBucket(null)).toBe(false);
  });

  it("rejects traversal and absolute paths", () => {
    expect(isSafePath("user/uuid.webp")).toBe(true);
    expect(isSafePath("../secret.webp")).toBe(false);
    expect(isSafePath("/etc/passwd")).toBe(false);
    expect(isSafePath(null)).toBe(false);
  });

  it("filters out any invalid (bucket, path) pairs", () => {
    const entries = validEntries([
      { bucket: "homework", path: "u/1.webp" },
      { bucket: "evil", path: "u/2.webp" },
      { bucket: "gallery", path: "../3.webp" },
    ]);
    expect(entries).toEqual([{ bucket: "homework", path: "u/1.webp" }]);
  });
});
