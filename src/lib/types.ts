// Row types mirroring the Supabase schema (see supabase/migrations).
// The client is intentionally untyped; results are cast to these shapes.

export type Lang = "en" | "hi";
export type UserRole = "principal" | "teacher";
export type UserStatus = "pending" | "approved" | "rejected" | "suspended";
export type NoticePriority = "normal" | "high" | "urgent";
export type BirthdayPublishMode = "text_only" | "with_photo" | "not_public";
export type ResourceVisibility = "public" | "private";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type MessageStatus = "new" | "in_progress" | "resolved";
export type AlertSeverity = "info" | "warning" | "critical";

export type RoleRow = {
  user_id: string;
  role: UserRole;
  status: UserStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type ClassRow = {
  id: string;
  code: string;
  name_en: string;
  name_hi: string | null;
  requires_section: boolean;
  sort_order: number;
};

export type SectionRow = {
  id: string;
  class_code: string;
  name: string;
  sort_order: number;
};

export type Facility = { key: string; name_en: string; name_hi: string | null };

export type SchoolSettings = {
  id: string;
  name_en: string | null;
  name_hi: string | null;
  tagline_en: string | null;
  tagline_hi: string | null;
  address_en: string | null;
  address_hi: string | null;
  phone: string | null;
  email: string | null;
  office_hours_en: string | null;
  office_hours_hi: string | null;
  established_year: string | null;
  principal_name: string | null;
  affiliation_en: string | null;
  affiliation_hi: string | null;
  affiliation_number: string | null;
  intro_en: string | null;
  intro_hi: string | null;
  about_en: string | null;
  about_hi: string | null;
  mission_en: string | null;
  mission_hi: string | null;
  vision_en: string | null;
  vision_hi: string | null;
  principal_message_en: string | null;
  principal_message_hi: string | null;
  privacy_contact: string | null;
  fee_message_en: string;
  fee_message_hi: string;
  social_links: Record<string, string>;
  map_url: string | null;
  admission_mode: "open" | "closed";
  default_language: Lang;
  facilities: Facility[];
  timezone: string;
  homework_retention_days: number;
  class_notice_retention_days: number;
  leave_retention_days: number;
  internal_notice_retention_days: number;
};

export type BrandingAsset = {
  id: string;
  key: string;
  bucket: string;
  path: string | null;
  public_url: string | null;
  alt_en: string | null;
  alt_hi: string | null;
};

export type TimingRow = {
  id: string;
  scope: "mon_fri" | "saturday";
  shift: "morning" | "day";
  start_time: string;
  end_time: string;
  classes_en: string | null;
  classes_hi: string | null;
  is_active: boolean;
};

export type EmergencyAlert = {
  id: string;
  enabled: boolean;
  message_en: string | null;
  message_hi: string | null;
  severity: AlertSeverity;
  link_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export type PublicNotice = {
  id: string;
  title_en: string;
  title_hi: string | null;
  summary_en: string | null;
  summary_hi: string | null;
  content_en: string | null;
  content_hi: string | null;
  category: string;
  priority: NoticePriority;
  pinned: boolean;
  urgent: boolean;
  is_published: boolean;
  effective_at: string;
  expiry_at: string | null;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
};

export type ClassNotice = {
  id: string;
  class_code: string;
  section: string | null;
  title_en: string;
  title_hi: string | null;
  content_en: string | null;
  content_hi: string | null;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  expires_at: string;
};

export type Homework = {
  id: string;
  class_code: string;
  section: string | null;
  homework_date: string;
  description_en: string;
  description_hi: string | null;
  image_paths: string[];
  is_published: boolean;
  created_by: string;
  created_at: string;
  expires_at: string;
};

export type CalendarEvent = {
  id: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  start_date: string;
  end_date: string | null;
  location_en: string | null;
  location_hi: string | null;
  is_published: boolean;
};

export type Achievement = {
  id: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  event_date: string | null;
  image_bucket: string | null;
  image_path: string | null;
  image_url: string | null;
  is_published: boolean;
};

export type Spotlight = {
  id: string;
  student_name: string;
  class_code: string | null;
  section: string | null;
  description_en: string;
  description_hi: string | null;
  photo_bucket: string | null;
  photo_path: string | null;
  photo_url: string | null;
  month: number | null;
  year: number | null;
  is_current: boolean;
  is_published: boolean;
  created_by: string;
};

export type BirthdayProfile = {
  id: string;
  student_name: string;
  class_code: string | null;
  section: string | null;
  dob: string;
  photo_bucket: string | null;
  photo_path: string | null;
  greeting_en: string | null;
  greeting_hi: string | null;
  publish_mode: BirthdayPublishMode;
  is_active: boolean;
  created_by: string;
};

export type PublicBirthday = {
  display_name: string;
  class_code: string | null;
  section: string | null;
  greeting_en: string | null;
  greeting_hi: string | null;
  photo_url: string | null;
};

export type GalleryImage = {
  id: string;
  title_en: string | null;
  title_hi: string | null;
  bucket: string;
  path: string;
  public_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type ResourceRow = {
  id: string;
  title_en: string;
  title_hi: string | null;
  description_en: string | null;
  description_hi: string | null;
  category: string | null;
  session: string | null;
  visibility: ResourceVisibility;
  bucket: string;
  path: string;
  file_name: string | null;
  mime_type: string | null;
  public_url: string | null;
  version: number;
  is_published: boolean;
};

export type ParentMessage = {
  id: string;
  student_name: string;
  sender_name: string;
  phone: string;
  class_code: string | null;
  section: string | null;
  message: string;
  status: MessageStatus;
  internal_notes: string | null;
  created_at: string;
};

export type AdmissionEnquiry = {
  id: string;
  student_name: string;
  guardian_name: string;
  phone: string;
  email: string | null;
  class_applying: string;
  current_school: string | null;
  message: string | null;
  status: MessageStatus;
  internal_notes: string | null;
  created_at: string;
};

export type InternalNotice = {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_by: string;
  created_at: string;
  expires_at: string;
};

export type LeaveRequest = {
  id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  half_day: boolean;
  reason: string;
  attachment_bucket: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  status: LeaveStatus;
  created_at: string;
  expires_at: string;
};

export type LeaveDecision = {
  id: string;
  request_id: string;
  decided_by: string | null;
  decision: LeaveStatus;
  note: string | null;
  decided_at: string;
};

export type Faq = {
  id: string;
  question_en: string;
  question_hi: string | null;
  answer_en: string;
  answer_hi: string | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
};

export type ChatbotSettings = {
  enabled: boolean;
  greeting_en: string;
  greeting_hi: string;
  disclaimer_en: string;
  disclaimer_hi: string;
  max_input_chars: number;
};
