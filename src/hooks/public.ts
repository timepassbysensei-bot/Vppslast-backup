import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getPublic } from "@/lib/functions";
import type {
  Achievement,
  BrandingAsset,
  CalendarEvent,
  ChatbotSettings,
  ClassNotice,
  ClassRow,
  EmergencyAlert,
  Faq,
  GalleryImage,
  Homework,
  PublicBirthday,
  PublicNotice,
  ResourceRow,
  SchoolSettings,
  SectionRow,
  Spotlight,
  TimingRow,
} from "@/lib/types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<SchoolSettings | null> => {
      const { data, error } = await supabase.from("school_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return (data as SchoolSettings | null) ?? null;
    },
    staleTime: 300_000,
  });
}

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: async (): Promise<Record<string, BrandingAsset>> => {
      const { data, error } = await supabase.from("branding_assets").select("*");
      if (error) throw error;
      const map: Record<string, BrandingAsset> = {};
      for (const row of (data ?? []) as BrandingAsset[]) map[row.key] = row;
      return map;
    },
    staleTime: 300_000,
  });
}

export function useTimings() {
  return useQuery({
    queryKey: ["timings"],
    queryFn: async (): Promise<TimingRow[]> => {
      const { data, error } = await supabase.from("timing_schedules").select("*").eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as TimingRow[];
    },
    staleTime: 300_000,
  });
}

export function useEmergencyAlert() {
  return useQuery({
    queryKey: ["alert"],
    queryFn: async (): Promise<EmergencyAlert | null> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("*")
        .eq("enabled", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as EmergencyAlert[];
      const active = rows.find(
        (a) => (!a.starts_at || a.starts_at <= nowIso) && (!a.ends_at || a.ends_at >= nowIso),
      );
      return active ?? null;
    },
    staleTime: 60_000,
  });
}

export function usePublicNotices(limit?: number) {
  return useQuery({
    queryKey: ["public_notices", limit ?? "all"],
    queryFn: async (): Promise<PublicNotice[]> => {
      let q = supabase
        .from("public_notices")
        .select("*")
        .order("pinned", { ascending: false })
        .order("effective_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PublicNotice[];
    },
  });
}

export function useUpcomingEvents(limit = 6) {
  return useQuery({
    queryKey: ["events", limit],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ["events_all"],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase.from("calendar_events").select("*").order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("event_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Achievement[];
    },
  });
}

export function useCurrentSpotlight() {
  return useQuery({
    queryKey: ["spotlight_current"],
    queryFn: async (): Promise<Spotlight | null> => {
      const { data, error } = await supabase
        .from("student_spotlights")
        .select("*")
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw error;
      return (data as Spotlight | null) ?? null;
    },
  });
}

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async (): Promise<GalleryImage[]> => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GalleryImage[];
    },
  });
}

export function usePublicResources() {
  return useQuery({
    queryKey: ["resources_public"],
    queryFn: async (): Promise<ResourceRow[]> => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<{ classes: ClassRow[]; sections: SectionRow[] }> => {
      const [c, s] = await Promise.all([
        supabase.from("classes").select("*").order("sort_order", { ascending: true }),
        supabase.from("sections").select("*").order("sort_order", { ascending: true }),
      ]);
      if (c.error) throw c.error;
      if (s.error) throw s.error;
      return { classes: (c.data ?? []) as ClassRow[], sections: (s.data ?? []) as SectionRow[] };
    },
    staleTime: 600_000,
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: async (): Promise<Faq[]> => {
      const { data, error } = await supabase.from("chatbot_faqs").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
    staleTime: 300_000,
  });
}

export function useChatbotSettings() {
  return useQuery({
    queryKey: ["chatbot_settings"],
    queryFn: async (): Promise<ChatbotSettings | null> => {
      const { data, error } = await supabase.from("chatbot_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return (data as ChatbotSettings | null) ?? null;
    },
    staleTime: 300_000,
  });
}

export function useClassContent(classCode: string | null, section: string | null) {
  return useQuery({
    queryKey: ["class_content", classCode, section],
    enabled: Boolean(classCode),
    queryFn: async (): Promise<{ homework: Homework[]; notices: ClassNotice[] }> => {
      if (!classCode) return { homework: [], notices: [] };
      let hwQ = supabase.from("homework_uploads").select("*").eq("class_code", classCode).order("homework_date", { ascending: false });
      let nQ = supabase.from("class_notices").select("*").eq("class_code", classCode).order("created_at", { ascending: false });
      if (section) {
        hwQ = hwQ.or(`section.is.null,section.eq.${section}`);
        nQ = nQ.or(`section.is.null,section.eq.${section}`);
      }
      const [hw, n] = await Promise.all([hwQ, nQ]);
      if (hw.error) throw hw.error;
      if (n.error) throw n.error;
      return { homework: (hw.data ?? []) as Homework[], notices: (n.data ?? []) as ClassNotice[] };
    },
  });
}

export function useBirthdaysToday() {
  return useQuery({
    queryKey: ["birthdays_today"],
    queryFn: async (): Promise<PublicBirthday[]> => {
      const data = await getPublic<{ birthdays: PublicBirthday[] }>("birthdays-today");
      return data.birthdays ?? [];
    },
    staleTime: 300_000,
  });
}
