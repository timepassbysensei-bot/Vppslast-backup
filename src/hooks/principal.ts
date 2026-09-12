import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import type {
  Achievement,
  AdmissionEnquiry,
  CalendarEvent,
  ClassNotice,
  EmergencyAlert,
  Faq,
  GalleryImage,
  Homework,
  InternalNotice,
  LeaveDecision,
  LeaveRequest,
  MessageStatus,
  ParentMessage,
  PublicNotice,
  ResourceRow,
  SchoolSettings,
} from "@/lib/types";

export type StaffRow = {
  user_id: string;
  role: "teacher" | "principal";
  status: string;
  approved_at: string | null;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

async function currentUid(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("not_authenticated");
  return uid;
}

async function profilesMap(ids: string[]): Promise<Record<string, { email: string | null; full_name: string | null }>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from("profiles").select("id, email, full_name").in("id", ids);
  if (error) throw error;
  const map: Record<string, { email: string | null; full_name: string | null }> = {};
  for (const p of (data ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
    map[p.id] = { email: p.email, full_name: p.full_name };
  }
  return map;
}

async function rolesWithProfiles(status: string): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, status, approved_at, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Omit<StaffRow, "email" | "full_name">[];
  const map = await profilesMap(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, email: map[r.user_id]?.email ?? null, full_name: map[r.user_id]?.full_name ?? null }));
}

// --------------------------------------------------------------- queries
export function usePendingStaff() {
  return useQuery({ queryKey: ["pending"], queryFn: () => rolesWithProfiles("pending") });
}

export function useRoster() {
  return useQuery({
    queryKey: ["roster"],
    queryFn: async (): Promise<StaffRow[]> => {
      const approved = await rolesWithProfiles("approved");
      const suspended = await rolesWithProfiles("suspended");
      return [...approved, ...suspended];
    },
  });
}

export function useAllHomework() {
  return useQuery({
    queryKey: ["homework_admin"],
    queryFn: async (): Promise<Homework[]> => {
      const { data, error } = await supabase.from("homework_uploads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Homework[];
    },
  });
}

export function useAllClassNotices() {
  return useQuery({
    queryKey: ["class_notices_admin"],
    queryFn: async (): Promise<ClassNotice[]> => {
      const { data, error } = await supabase.from("class_notices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClassNotice[];
    },
  });
}

export function usePublicNoticesAdmin() {
  return useQuery({
    queryKey: ["public_notices_admin"],
    queryFn: async (): Promise<PublicNotice[]> => {
      const { data, error } = await supabase.from("public_notices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PublicNotice[];
    },
  });
}

export function useLeaveInbox() {
  return useQuery({
    queryKey: ["leave_inbox"],
    queryFn: async (): Promise<{ requests: (LeaveRequest & { email: string | null; full_name: string | null })[]; decisions: LeaveDecision[] }> => {
      const [req, dec] = await Promise.all([
        supabase.from("teacher_leave_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("leave_decisions").select("*"),
      ]);
      if (req.error) throw req.error;
      if (dec.error) throw dec.error;
      const requests = (req.data ?? []) as LeaveRequest[];
      const map = await profilesMap(requests.map((r) => r.teacher_id));
      return {
        requests: requests.map((r) => ({ ...r, email: map[r.teacher_id]?.email ?? null, full_name: map[r.teacher_id]?.full_name ?? null })),
        decisions: (dec.data ?? []) as LeaveDecision[],
      };
    },
  });
}

export function useInternalNoticesAdmin() {
  return useQuery({
    queryKey: ["internal_notices_admin"],
    queryFn: async (): Promise<{ notices: InternalNotice[]; readCounts: Record<string, number> }> => {
      const [n, r] = await Promise.all([
        supabase.from("internal_teacher_notices").select("*").order("created_at", { ascending: false }),
        supabase.from("internal_notice_reads").select("notice_id"),
      ]);
      if (n.error) throw n.error;
      if (r.error) throw r.error;
      const counts: Record<string, number> = {};
      for (const row of (r.data ?? []) as { notice_id: string }[]) counts[row.notice_id] = (counts[row.notice_id] ?? 0) + 1;
      return { notices: (n.data ?? []) as InternalNotice[], readCounts: counts };
    },
  });
}

export function useGalleryAdmin() {
  return useQuery({
    queryKey: ["gallery_admin"],
    queryFn: async (): Promise<GalleryImage[]> => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });
}

export function useResourcesAdmin() {
  return useQuery({
    queryKey: ["resources_admin"],
    queryFn: async (): Promise<ResourceRow[]> => {
      const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
  });
}

export function useParentMessages() {
  return useQuery({
    queryKey: ["parent_messages"],
    queryFn: async (): Promise<ParentMessage[]> => {
      const { data, error } = await supabase.from("parent_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ParentMessage[];
    },
  });
}

export function useAdmissionEnquiries() {
  return useQuery({
    queryKey: ["admission_enquiries"],
    queryFn: async (): Promise<AdmissionEnquiry[]> => {
      const { data, error } = await supabase.from("admission_enquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdmissionEnquiry[];
    },
  });
}

export function useEventsAdmin() {
  return useQuery({
    queryKey: ["events_admin"],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase.from("calendar_events").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useAchievementsAdmin() {
  return useQuery({
    queryKey: ["achievements_admin"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase.from("achievements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });
}

export function useFaqsAdmin() {
  return useQuery({
    queryKey: ["faqs_admin"],
    queryFn: async (): Promise<Faq[]> => {
      const { data, error } = await supabase.from("chatbot_faqs").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });
}

export type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  content_type: string | null;
  record_id: string | null;
  class_code: string | null;
  section: string | null;
  created_at: string;
};

export function useAudit() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, actor_id, actor_role, action, content_type, record_id, class_code, section, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });
}

// ------------------------------------------------------------- mutations
export function useCreateInternalNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { title: string; content: string; priority: "normal" | "high" | "urgent"; file: File | null }) => {
      const uid = await currentUid();
      let attachment_bucket: string | null = null;
      let attachment_path: string | null = null;
      let attachment_name: string | null = null;
      if (vars.file) {
        attachment_path = await uploadFile("internal-notices", uid, vars.file, "image_or_pdf");
        attachment_bucket = "internal-notices";
        attachment_name = vars.file.name;
      }
      const { error } = await supabase.from("internal_teacher_notices").insert({
        title: vars.title,
        content: vars.content,
        priority: vars.priority,
        attachment_bucket,
        attachment_path,
        attachment_name,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["internal_notices_admin"] });
      void qc.invalidateQueries({ queryKey: ["internal_notices"] });
    },
  });
}

export function useSavePublicNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id?: string; patch: Partial<PublicNotice> }) => {
      if (vars.id) {
        const { error } = await supabase.from("public_notices").update(vars.patch).eq("id", vars.id);
        if (error) throw error;
      } else {
        const uid = await currentUid();
        const { error } = await supabase.from("public_notices").insert({ ...vars.patch, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["public_notices_admin"] });
      void qc.invalidateQueries({ queryKey: ["public_notices"] });
    },
  });
}

export function useSaveTimings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { id: string; start_time: string; end_time: string }[]) => {
      for (const r of rows) {
        const { error } = await supabase
          .from("timing_schedules")
          .update({ start_time: r.start_time, end_time: r.end_time })
          .eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["timings"] }),
  });
}

export function useSaveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: Partial<EmergencyAlert> & { id?: string }) => {
      if (vars.id) {
        const { id, ...patch } = vars;
        const { error } = await supabase.from("emergency_alerts").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { id: _ignore, ...insert } = vars;
        void _ignore;
        const { error } = await supabase.from("emergency_alerts").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["alert"] }),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SchoolSettings> & { id: string }) => {
      const { id, ...rest } = patch;
      const uid = await currentUid();
      const { error } = await supabase.from("school_settings").update({ ...rest, updated_by: uid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useUploadGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { file: File; title_en: string | null; title_hi: string | null; sort_order: number }) => {
      const uid = await currentUid();
      const path = await uploadFile("gallery", uid, vars.file, "image");
      const public_url = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("gallery_images").insert({
        bucket: "gallery",
        path,
        public_url,
        title_en: vars.title_en,
        title_hi: vars.title_hi,
        sort_order: vars.sort_order,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gallery"] });
      void qc.invalidateQueries({ queryKey: ["gallery_admin"] });
    },
  });
}

export function useUploadResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      file: File;
      title_en: string;
      title_hi: string | null;
      description_en: string | null;
      category: string | null;
      session: string | null;
      visibility: "public" | "private";
    }) => {
      const uid = await currentUid();
      const bucket = vars.visibility === "public" ? "resources-public" : "resources-private";
      const path = await uploadFile(bucket, uid, vars.file, "image_or_pdf");
      const public_url = vars.visibility === "public" ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
      const { error } = await supabase.from("resources").insert({
        title_en: vars.title_en,
        title_hi: vars.title_hi,
        description_en: vars.description_en,
        category: vars.category,
        session: vars.session,
        visibility: vars.visibility,
        bucket,
        path,
        file_name: vars.file.name,
        mime_type: vars.file.type,
        size_bytes: vars.file.size,
        public_url,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resources_public"] });
      void qc.invalidateQueries({ queryKey: ["resources_admin"] });
    },
  });
}

export function useLeaveDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { request_id: string; decision: "approved" | "rejected"; note: string | null }) => {
      const uid = await currentUid();
      const { error: updErr } = await supabase
        .from("teacher_leave_requests")
        .update({ status: vars.decision })
        .eq("id", vars.request_id);
      if (updErr) throw updErr;
      const { error } = await supabase.from("leave_decisions").insert({
        request_id: vars.request_id,
        decided_by: uid,
        decision: vars.decision,
        note: vars.note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leave_inbox"] });
      void qc.invalidateQueries({ queryKey: ["leave_mine"] });
    },
  });
}

export function useUpdateMessageStatus(kind: "parent_messages" | "admission_enquiries") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; status?: MessageStatus; internal_notes?: string }) => {
      const patch: Record<string, unknown> = {};
      if (vars.status) patch.status = vars.status;
      if (vars.internal_notes !== undefined) patch.internal_notes = vars.internal_notes;
      const { error } = await supabase.from(kind).update(patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [kind] }),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: Partial<CalendarEvent>) => {
      const uid = await currentUid();
      const { error } = await supabase.from("calendar_events").insert({ ...vars, created_by: uid });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["events_admin"] });
      void qc.invalidateQueries({ queryKey: ["events"] });
      void qc.invalidateQueries({ queryKey: ["events_all"] });
    },
  });
}

export function useCreateAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title_en: string;
      title_hi: string | null;
      description_en: string | null;
      description_hi: string | null;
      event_date: string | null;
      file: File | null;
    }) => {
      const uid = await currentUid();
      let image_bucket: string | null = null;
      let image_path: string | null = null;
      let image_url: string | null = null;
      if (vars.file) {
        image_path = await uploadFile("gallery", uid, vars.file, "image");
        image_bucket = "gallery";
        image_url = supabase.storage.from("gallery").getPublicUrl(image_path).data.publicUrl;
      }
      const { error } = await supabase.from("achievements").insert({
        title_en: vars.title_en,
        title_hi: vars.title_hi,
        description_en: vars.description_en,
        description_hi: vars.description_hi,
        event_date: vars.event_date,
        image_bucket,
        image_path,
        image_url,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["achievements"] });
      void qc.invalidateQueries({ queryKey: ["achievements_admin"] });
    },
  });
}

export function useUpsertFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id?: string; patch: Partial<Faq> }) => {
      if (vars.id) {
        const { error } = await supabase.from("chatbot_faqs").update(vars.patch).eq("id", vars.id);
        if (error) throw error;
      } else {
        const uid = await currentUid();
        const { error } = await supabase.from("chatbot_faqs").insert({ ...vars.patch, created_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["faqs"] });
      void qc.invalidateQueries({ queryKey: ["faqs_admin"] });
    },
  });
}

export function useToggleGalleryPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("gallery_images").update({ is_published: vars.is_published }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gallery"] });
      void qc.invalidateQueries({ queryKey: ["gallery_admin"] });
    },
  });
}
