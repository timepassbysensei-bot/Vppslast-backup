import { z } from "zod";

// Shared primitives -------------------------------------------------------
const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

// Loose but safe phone check: digits, spaces, +, -, parentheses.
const phone = z
  .string()
  .trim()
  .min(6)
  .max(20)
  .regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number.");

export const admissionSchema = z.object({
  student_name: trimmed(120),
  guardian_name: trimmed(120),
  phone,
  email: z.string().trim().email().max(160).optional().or(z.literal("").transform(() => undefined)),
  class_applying: trimmed(40),
  current_school: optionalTrimmed(160),
  message: optionalTrimmed(1000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
  turnstileToken: z.string().min(1).max(4000).optional(),
});
export type AdmissionInput = z.infer<typeof admissionSchema>;

export const parentMessageSchema = z.object({
  student_name: trimmed(120),
  sender_name: trimmed(120),
  phone,
  class_code: trimmed(40),
  section: optionalTrimmed(20),
  message: trimmed(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
  turnstileToken: z.string().min(1).max(4000).optional(),
});
export type ParentMessageInput = z.infer<typeof parentMessageSchema>;

export const senseiSchema = z.object({
  message: z.string().trim().min(1).max(500),
  lang: z.enum(["en", "hi"]).default("en"),
  turnstileToken: z.string().min(1).max(4000).optional(),
});
export type SenseiInput = z.infer<typeof senseiSchema>;

export const approveTeacherSchema = z.object({
  target_user_id: z.string().uuid(),
  action: z.enum(["approve", "reject", "suspend"]),
});
export type ApproveTeacherInput = z.infer<typeof approveTeacherSchema>;

export const signedFileSchema = z.object({
  kind: z.enum(["resource", "leave_attachment", "internal_notice", "parent_attachment"]),
  record_id: z.string().uuid(),
});
export type SignedFileInput = z.infer<typeof signedFileSchema>;

export const deleteContentSchema = z.object({
  content_type: z.enum([
    "homework",
    "class_notice",
    "public_notice",
    "spotlight",
    "birthday",
    "gallery_image",
    "resource",
    "calendar_event",
    "achievement",
    "internal_notice",
    "leave_request",
    "parent_message",
    "admission_enquiry",
  ]),
  record_id: z.string().uuid(),
});
export type DeleteContentInput = z.infer<typeof deleteContentSchema>;

export const bootstrapSchema = z.object({
  secret: z.string().min(1).max(400),
});
