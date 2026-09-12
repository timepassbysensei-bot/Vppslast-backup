import { describe, it, expect } from "vitest";
import { pickText } from "@/lib/content";

describe("pickText bilingual fallback", () => {
  it("returns English in English mode", () => {
    const r = pickText("Hello", "नमस्ते", "en");
    expect(r.value).toBe("Hello");
    expect(r.missingHi).toBe(false);
  });

  it("returns Hindi in Hindi mode when present", () => {
    const r = pickText("Hello", "नमस्ते", "hi");
    expect(r.value).toBe("नमस्ते");
    expect(r.missingHi).toBe(false);
  });

  it("falls back to English and flags missing Hindi", () => {
    const r = pickText("Hello", null, "hi");
    expect(r.value).toBe("Hello");
    expect(r.missingHi).toBe(true);
  });

  it("does not flag missing Hindi when English is also empty", () => {
    const r = pickText("", "", "hi");
    expect(r.value).toBe("");
    expect(r.missingHi).toBe(false);
  });
});
