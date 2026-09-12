import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(6, "Enter a valid phone number.")
  .max(20)
  .regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number.");

export const admissionForm = z.object({
  student_name: z.string().trim().min(1, "Required").max(120),
  guardian_name: z.string().trim().min(1, "Required").max(120),
  phone,
  email: z.union([z.string().trim().email("Enter a valid email.").max(160), z.literal("")]).optional(),
  class_applying: z.string().trim().min(1, "Required").max(40),
  current_school: z.string().trim().max(160).optional(),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
});
export type AdmissionForm = z.infer<typeof admissionForm>;

export const parentMessageForm = z.object({
  student_name: z.string().trim().min(1, "Required").max(120),
  sender_name: z.string().trim().min(1, "Required").max(120),
  phone,
  class_code: z.string().trim().min(1, "Required").max(40),
  section: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Required").max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
});
export type ParentMessageForm = z.infer<typeof parentMessageForm>;
