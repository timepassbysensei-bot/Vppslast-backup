import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callAuthed } from "@/lib/functions";

export function useInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) => {
    for (const k of keys) void qc.invalidateQueries({ queryKey: [k] });
  };
}

export type DeleteContentType =
  | "homework"
  | "class_notice"
  | "public_notice"
  | "spotlight"
  | "birthday"
  | "gallery_image"
  | "resource"
  | "calendar_event"
  | "achievement"
  | "internal_notice"
  | "leave_request"
  | "parent_message"
  | "admission_enquiry";

// Invalidation targets per content type so the UI updates reactively.
const INVALIDATE: Record<DeleteContentType, string[]> = {
  homework: ["homework_admin", "class_content", "homework_mine"],
  class_notice: ["class_notices_admin", "class_content", "class_notices_mine"],
  public_notice: ["public_notices", "public_notices_admin"],
  spotlight: ["spotlight_current", "spotlights_admin"],
  birthday: ["birthdays_admin", "birthdays_today"],
  gallery_image: ["gallery", "gallery_admin"],
  resource: ["resources_public", "resources_admin"],
  calendar_event: ["events", "events_all", "events_admin"],
  achievement: ["achievements", "achievements_admin"],
  internal_notice: ["internal_notices", "internal_notices_admin"],
  leave_request: ["leave_mine", "leave_inbox"],
  parent_message: ["parent_messages"],
  admission_enquiry: ["admission_enquiries"],
};

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { content_type: DeleteContentType; record_id: string }) =>
      callAuthed("delete-content", vars),
    onSuccess: (_data, vars) => {
      for (const key of INVALIDATE[vars.content_type]) {
        void qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useApproveTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { target_user_id: string; action: "approve" | "reject" | "suspend" }) =>
      callAuthed("approve-teacher", vars),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pending"] });
      void qc.invalidateQueries({ queryKey: ["roster"] });
    },
  });
}
