import { describe, it, expect } from "vitest";
import { allowedExtension, safeObjectPath } from "@/lib/upload";

describe("upload validation", () => {
  it("maps allowed image MIME types to extensions", () => {
    expect(allowedExtension("image/jpeg", "image")).toBe("jpg");
    expect(allowedExtension("image/png", "image")).toBe("png");
    expect(allowedExtension("image/webp", "image")).toBe("webp");
  });

  it("rejects PDFs when only images are allowed", () => {
    expect(allowedExtension("application/pdf", "image")).toBeNull();
  });

  it("allows PDFs for document uploads", () => {
    expect(allowedExtension("application/pdf", "image_or_pdf")).toBe("pdf");
  });

  it("rejects dangerous types (SVG, HTML, scripts)", () => {
    expect(allowedExtension("image/svg+xml", "image_or_pdf")).toBeNull();
    expect(allowedExtension("text/html", "image_or_pdf")).toBeNull();
    expect(allowedExtension("application/javascript", "image_or_pdf")).toBeNull();
  });

  it("generates an owner-scoped random path and never trusts the original name", () => {
    const path = safeObjectPath("user-123", "image/webp", "image");
    expect(path).not.toBeNull();
    expect(path).toMatch(/^user-123\/[0-9a-f-]{36}\.webp$/);
  });

  it("returns null for unsupported types", () => {
    expect(safeObjectPath("user-123", "application/zip", "image_or_pdf")).toBeNull();
  });
});
