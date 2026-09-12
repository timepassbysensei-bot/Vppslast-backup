import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import type {
  BirthdayProfile,
  ClassNotice,
  Homework,
  InternalNotice,
  LeaveDecision,
  LeaveRequest,
  Spotlight,
} from "@/lib/types";

async function currentUid(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("not_authenticated");
  return uid;
}

// ---------------------------------------------------------------- queries
export function useRecentHomework() {
  return useQuery({
    queryKey: ["homework_mine"],
    queryFn: async (): Promise<Homework[]> => {
      const { data, error } = await supabase
        .from("homework_uploads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Homework[];
    },
  });
}

export function useMyClassNotices() {
  return useQuery({
    queryKey: ["class_notices_mine"],
    queryFn: async (): Promise<ClassNotice[]> => {
      const { data, error } = await supabase
        .from("class_notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ClassNotice[];
    },
  });
}

export function useInternalNotices() {
  return useQuery({
    queryKey: ["internal_notices"],
    queryFn: async (): Promise<{ notices: InternalNotice[]; readIds: string[] }> => {
      const [n, r] = await Promise.all([
        supabase.from("internal_teacher_notices").select("*").order("created_at", { ascending: false }),
        supabase.from("internal_notice_reads").select("notice_id"),
      ]);
      if (n.error) throw n.error;
      if (r.error) throw r.error;
      return {
        notices: (n.data ?? []) as InternalNotice[],
        readIds: ((r.data ?? []) as { notice_id: string }[]).map((x) => x.notice_id),
      };
    },
  });
}

export function useMyLeave() {
  return useQuery({
    queryKey: ["leave_mine"],
    queryFn: async (): Promise<{ requests: LeaveRequest[]; decisions: LeaveDecision[] }> => {
      const [req, dec] = await Promise.all([
        supabase.from("teacher_leave_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("leave_decisions").select("*"),
      ]);
      if (req.error) throw req.error;
      if (dec.error) throw dec.error;
      return { requests: (req.data ?? []) as LeaveRequest[], decisions: (dec.data ?? []) as LeaveDecision[] };
    },
  });
}

export function useMyBirthdays() {
  return useQuery({
    queryKey: ["birthdays_admin"],
    queryFn: async (): Promise<BirthdayProfile[]> => {
      const { data, error } = await supabase.from("birthday_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BirthdayProfile[];
    },
  });
}

export function useSpotlights() {
  return useQuery({
    queryKey: ["spotlights_admin"],
    queryFn: async (): Promise<Spotlight[]> => {
      const { data, error } = await supabase.from("student_spotlights").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Spotlight[];
    },
  });
}

// -------------------------------------------------------------- mutations
export function useCreateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      class_code: string;
      section: string | null;
      homework_date: string;
      description_en: string;
      description_hi: string | null;
      images: File[];
    }) => {
      const uid = await currentUid();
      if (vars.images.length > 2) throw new Error("too_many_images");
      const paths: string[] = [];
      for (const file of vars.images) {
        paths.push(await uploadFile("homework", uid, file, "image"));
      }
      const { error } = await supabase.from("homework_uploads").insert({
        class_code: vars.class_code,
        section: vars.section,
        homework_date: vars.homework_date,
        description_en: vars.description_en,
        description_hi: vars.description_hi,
        image_paths: paths,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["homework_mine"] });
      void qc.invalidateQueries({ queryKey: ["homework_admin"] });
      void qc.invalidateQueries({ queryKey: ["class_content"] });
    },
  });
}

export function useCreateClassNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      class_code: string;
      section: string | null;
      title_en: string;
      title_hi: string | null;
      content_en: string | null;
      content_hi: string | null;
    }) => {
      const uid = await currentUid();
      const { error } = await supabase.from("class_notices").insert({ ...vars, created_by: uid });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["class_notices_mine"] });
      void qc.invalidateQueries({ queryKey: ["class_notices_admin"] });
      void qc.invalidateQueries({ queryKey: ["class_content"] });
    },
  });
}

export function useUpdateClassNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<ClassNotice> }) => {
      const { error } = await supabase.from("class_notices").update(vars.patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["class_notices_mine"] });
      void qc.invalidateQueries({ queryKey: ["class_notices_admin"] });
      void qc.invalidateQueries({ queryKey: ["class_content"] });
    },
  });
}

export function useMarkNoticeRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noticeId: string) => {
      const uid = await currentUid();
      const { error } = await supabase
        .from("internal_notice_reads")
        .upsert({ notice_id: noticeId, teacher_id: uid }, { onConflict: "notice_id,teacher_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["internal_notices"] }),
  });
}

export function useSubmitLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      start_date: string;
      end_date: string;
      half_day: boolean;
      reason: string;
      file: File | null;
    }) => {
      const uid = await currentUid();
      let attachment_bucket: string | null = null;
      let attachment_path: string | null = null;
      let attachment_name: string | null = null;
      if (vars.file) {
        attachment_path = await uploadFile("leave-attachments", uid, vars.file, "image_or_pdf");
        attachment_bucket = "leave-attachments";
        attachment_name = vars.file.name;
      }
      const { error } = await supabase.from("teacher_leave_requests").insert({
        teacher_id: uid,
        start_date: vars.start_date,
        end_date: vars.end_date,
        half_day: vars.half_day,
        reason: vars.reason,
        attachment_bucket,
        attachment_path,
        attachment_name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leave_mine"] });
      void qc.invalidateQueries({ queryKey: ["leave_inbox"] });
    },
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_leave_requests").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leave_mine"] });
      void qc.invalidateQueries({ queryKey: ["leave_inbox"] });
    },
  });
}

export function useCreateBirthday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      student_name: string;
      class_code: string | null;
      section: string | null;
      dob: string;
      greeting_en: string | null;
      greeting_hi: string | null;
      publish_mode: "text_only" | "with_photo" | "not_public";
      file: File | null;
    }) => {
      const uid = await currentUid();
      let photo_bucket: string | null = null;
      let photo_path: string | null = null;
      if (vars.file) {
        photo_path = await uploadFile("birthday", uid, vars.file, "image");
        photo_bucket = "birthday";
      }
      const { error } = await supabase.from("birthday_profiles").insert({
        student_name: vars.student_name,
        class_code: vars.class_code,
        section: vars.section,
        dob: vars.dob,
        greeting_en: vars.greeting_en,
        greeting_hi: vars.greeting_hi,
        publish_mode: vars.publish_mode,
        photo_bucket,
        photo_path,
        created_by: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["birthdays_admin"] });
      void qc.invalidateQueries({ queryKey: ["birthdays_today"] });
    },
  });
}

export function useCreateSpotlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      student_name: string;
      class_code: string | null;
      section: string | null;
      description_en: string;
      description_hi: string | null;
      month: number | null;
      year: number | null;
      makeCurrent: boolean;
      file: File | null;
    }) => {
      const uid = await currentUid();
      let photo_bucket: string | null = null;
      let photo_path: string | null = null;
      let photo_url: string | null = null;
      if (vars.file) {
        photo_path = await uploadFile("spotlight", uid, vars.file, "image");
        photo_bucket = "spotlight";
        photo_url = supabase.storage.from("spotlight").getPublicUrl(photo_path).data.publicUrl;
      }
      const { data, error } = await supabase
        .from("student_spotlights")
        .insert({
          student_name: vars.student_name,
          class_code: vars.class_code,
          section: vars.section,
          description_en: vars.description_en,
          description_hi: vars.description_hi,
          month: vars.month,
          year: vars.year,
          photo_bucket,
          photo_path,
          photo_url,
          created_by: uid,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (vars.makeCurrent && data) {
        const { error: rpcErr } = await supabase.rpc("set_current_spotlight", { p_id: (data as { id: string }).id });
        if (rpcErr) throw rpcErr;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["spotlights_admin"] });
      void qc.invalidateQueries({ queryKey: ["spotlight_current"] });
    },
  });
}

export function useMakeSpotlightCurrent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("set_current_spotlight", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["spotlights_admin"] });
      void qc.invalidateQueries({ queryKey: ["spotlight_current"] });
    },
  });
}
