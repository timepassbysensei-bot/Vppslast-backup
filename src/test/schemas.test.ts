import { describe, it, expect } from "vitest";
import { admissionForm, parentMessageForm } from "@/lib/schemas";

describe("admission form validation", () => {
  it("accepts a valid enquiry", () => {
    const r = admissionForm.safeParse({
      student_name: "A Student",
      guardian_name: "A Guardian",
      phone: "+91 90000 00000",
      class_applying: "Class 1",
      consent: true,
    });
    expect(r.success).toBe(true);
  });

  it("requires consent", () => {
    const r = admissionForm.safeParse({
      student_name: "A",
      guardian_name: "B",
      phone: "9000000000",
      class_applying: "1",
      consent: false,
    });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    const r = admissionForm.safeParse({
      student_name: "A",
      guardian_name: "B",
      phone: "abc",
      class_applying: "1",
      consent: true,
    });
    expect(r.success).toBe(false);
  });
});

describe("parent message validation", () => {
  it("requires a message and consent", () => {
    const bad = parentMessageForm.safeParse({
      student_name: "A",
      sender_name: "B",
      phone: "9000000000",
      class_code: "1",
      message: "",
      consent: true,
    });
    expect(bad.success).toBe(false);
  });

  it("accepts a valid message", () => {
    const ok = parentMessageForm.safeParse({
      student_name: "A",
      sender_name: "B",
      phone: "9000000000",
      class_code: "1",
      message: "Hello, I have a question.",
      consent: true,
    });
    expect(ok.success).toBe(true);
  });
});
