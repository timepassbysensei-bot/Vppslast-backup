-- =========================================================================
-- View Point Public School — 0001_schema.sql
-- Tables, enums, helper functions, triggers, seeds.
-- Safe to run once on a clean Supabase project.
-- RLS is ENABLED here but POLICIES live in 0002_rls.sql.
-- =========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('principal', 'teacher');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notice_priority as enum ('normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.birthday_publish_mode as enum ('text_only', 'with_photo', 'not_public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.resource_visibility as enum ('public', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_status as enum ('new', 'in_progress', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helper: set updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Authentication & authorization
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'teacher',
  status public.user_status not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roles_updated on public.user_roles;
create trigger trg_user_roles_updated before update on public.user_roles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER authorization helpers (safe search_path)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.is_principal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = 'principal'
      and status = 'approved'
  );
$$;

-- Approved staff who may use teacher tools (teacher OR principal, must be approved).
create or replace function public.is_active_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and status = 'approved'
      and role in ('teacher', 'principal')
  );
$$;

create or replace function public.owns_record(created_by uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select created_by is not distinct from auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Signup auto-provision trigger (SECURITY DEFINER on auth.users)
-- Never promotes; never approves.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  -- Always default to teacher/pending. ON CONFLICT DO NOTHING guarantees an
  -- existing role row (e.g. a previously bootstrapped principal) is never
  -- downgraded or re-approved by a fresh signup event.
  insert into public.user_roles (user_id, role, status)
  values (new.id, 'teacher', 'pending')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- School structure & settings
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_hi text,
  requires_section boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(code) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (class_code, name)
);

create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  name_en text,
  name_hi text,
  tagline_en text,
  tagline_hi text,
  address_en text,
  address_hi text,
  phone text,
  email text,
  office_hours_en text,
  office_hours_hi text,
  established_year text,
  principal_name text,
  affiliation_en text,
  affiliation_hi text,
  affiliation_number text,
  intro_en text,
  intro_hi text,
  about_en text,
  about_hi text,
  mission_en text,
  mission_hi text,
  vision_en text,
  vision_hi text,
  principal_message_en text,
  principal_message_hi text,
  privacy_contact text,
  fee_message_en text not null default 'For fee information, please contact the school office directly.',
  fee_message_hi text not null default 'फ़ीस संबंधी जानकारी के लिए कृपया सीधे विद्यालय कार्यालय से संपर्क करें।',
  social_links jsonb not null default '{}'::jsonb,
  map_url text,
  admission_mode text not null default 'closed',
  default_language text not null default 'en',
  facilities jsonb not null default '[]'::jsonb,
  timezone text not null default 'Asia/Kolkata',
  homework_retention_days integer not null default 7,
  class_notice_retention_days integer not null default 7,
  leave_retention_days integer not null default 5,
  internal_notice_retention_days integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint school_settings_admission_mode_chk check (admission_mode in ('open', 'closed')),
  constraint school_settings_default_language_chk check (default_language in ('en', 'hi'))
);

drop trigger if exists trg_school_settings_updated on public.school_settings;
create trigger trg_school_settings_updated before update on public.school_settings
  for each row execute function public.set_updated_at();

create table if not exists public.branding_assets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  bucket text not null default 'branding',
  path text,
  public_url text,
  alt_en text,
  alt_hi text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists trg_branding_updated on public.branding_assets;
create trigger trg_branding_updated before update on public.branding_assets
  for each row execute function public.set_updated_at();

create table if not exists public.timing_schedules (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  shift text not null,
  start_time time not null,
  end_time time not null,
  classes_en text,
  classes_hi text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint timing_scope_chk check (scope in ('mon_fri', 'saturday')),
  constraint timing_shift_chk check (shift in ('morning', 'day'))
);

-- Preserve exactly one active schedule per (scope, shift).
create unique index if not exists timing_active_unique
  on public.timing_schedules (scope, shift)
  where is_active;

drop trigger if exists trg_timing_updated on public.timing_schedules;
create trigger trg_timing_updated before update on public.timing_schedules
  for each row execute function public.set_updated_at();

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  message_en text,
  message_hi text,
  severity public.alert_severity not null default 'info',
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists trg_alert_updated on public.emergency_alerts;
create trigger trg_alert_updated before update on public.emergency_alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public & class content
-- ---------------------------------------------------------------------------
create table if not exists public.public_notices (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_hi text,
  summary_en text,
  summary_hi text,
  content_en text,
  content_hi text,
  category text not null default 'general',
  priority public.notice_priority not null default 'normal',
  pinned boolean not null default false,
  urgent boolean not null default false,
  is_published boolean not null default false,
  effective_at timestamptz not null default now(),
  expiry_at timestamptz,
  attachment_bucket text,
  attachment_path text,
  attachment_name text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_public_notices_updated on public.public_notices;
create trigger trg_public_notices_updated before update on public.public_notices
  for each row execute function public.set_updated_at();

create table if not exists public.class_notices (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(code) on delete restrict,
  section text,
  title_en text not null,
  title_hi text,
  content_en text,
  content_hi text,
  attachment_bucket text,
  attachment_path text,
  attachment_name text,
  is_published boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

drop trigger if exists trg_class_notices_updated on public.class_notices;
create trigger trg_class_notices_updated before update on public.class_notices
  for each row execute function public.set_updated_at();

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_hi text,
  description_en text,
  description_hi text,
  start_date date not null,
  end_date date,
  location_en text,
  location_hi text,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_calendar_updated on public.calendar_events;
create trigger trg_calendar_updated before update on public.calendar_events
  for each row execute function public.set_updated_at();

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_hi text,
  description_en text,
  description_hi text,
  event_date date,
  image_bucket text,
  image_path text,
  image_url text,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_achievements_updated on public.achievements;
create trigger trg_achievements_updated before update on public.achievements
  for each row execute function public.set_updated_at();

create table if not exists public.homework_uploads (
  id uuid primary key default gen_random_uuid(),
  class_code text not null references public.classes(code) on delete restrict,
  section text,
  homework_date date not null default (now() at time zone 'Asia/Kolkata')::date,
  description_en text not null,
  description_hi text,
  image_paths text[] not null default '{}'::text[],
  is_published boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint homework_max_two_images check (coalesce(array_length(image_paths, 1), 0) <= 2)
);

drop trigger if exists trg_homework_updated on public.homework_uploads;
create trigger trg_homework_updated before update on public.homework_uploads
  for each row execute function public.set_updated_at();

create table if not exists public.homework_versions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework_uploads(id) on delete cascade,
  description_en text,
  description_hi text,
  image_paths text[] not null default '{}'::text[],
  edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_spotlights (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  class_code text references public.classes(code) on delete set null,
  section text,
  description_en text not null,
  description_hi text,
  photo_bucket text,
  photo_path text,
  photo_url text,
  month integer check (month between 1 and 12),
  year integer,
  is_current boolean not null default false,
  is_published boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one "current" spotlight may exist at a time.
create unique index if not exists spotlight_single_current
  on public.student_spotlights ((is_current))
  where is_current;

drop trigger if exists trg_spotlight_updated on public.student_spotlights;
create trigger trg_spotlight_updated before update on public.student_spotlights
  for each row execute function public.set_updated_at();

create table if not exists public.birthday_profiles (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  class_code text references public.classes(code) on delete set null,
  section text,
  dob date not null,
  photo_bucket text,
  photo_path text,
  greeting_en text,
  greeting_hi text,
  publish_mode public.birthday_publish_mode not null default 'text_only',
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_birthday_updated on public.birthday_profiles;
create trigger trg_birthday_updated before update on public.birthday_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_hi text,
  bucket text not null default 'gallery',
  path text not null,
  public_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_gallery_updated on public.gallery_images;
create trigger trg_gallery_updated before update on public.gallery_images
  for each row execute function public.set_updated_at();

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_hi text,
  description_en text,
  description_hi text,
  category text,
  session text,
  visibility public.resource_visibility not null default 'public',
  bucket text not null,
  path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  public_url text,
  version integer not null default 1,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_resources_updated on public.resources;
create trigger trg_resources_updated before update on public.resources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Private communication (principal-only reads)
-- ---------------------------------------------------------------------------
create table if not exists public.parent_messages (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  sender_name text not null,
  phone text not null,
  class_code text,
  section text,
  message text not null,
  consent boolean not null default false,
  status public.message_status not null default 'new',
  internal_notes text,
  attachment_bucket text,
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_parent_messages_updated on public.parent_messages;
create trigger trg_parent_messages_updated before update on public.parent_messages
  for each row execute function public.set_updated_at();

create table if not exists public.admission_enquiries (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  guardian_name text not null,
  phone text not null,
  email text,
  class_applying text not null,
  current_school text,
  message text,
  consent boolean not null default false,
  status public.message_status not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admission_updated on public.admission_enquiries;
create trigger trg_admission_updated before update on public.admission_enquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Staff-only content
-- ---------------------------------------------------------------------------
create table if not exists public.internal_teacher_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority public.notice_priority not null default 'normal',
  attachment_bucket text,
  attachment_path text,
  attachment_name text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 days')
);

drop trigger if exists trg_internal_notices_updated on public.internal_teacher_notices;
create trigger trg_internal_notices_updated before update on public.internal_teacher_notices
  for each row execute function public.set_updated_at();

create table if not exists public.internal_notice_reads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.internal_teacher_notices(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notice_id, teacher_id)
);

create table if not exists public.teacher_leave_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  half_day boolean not null default false,
  reason text not null,
  attachment_bucket text,
  attachment_path text,
  attachment_name text,
  status public.leave_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 days'),
  constraint leave_date_order check (end_date >= start_date)
);

drop trigger if exists trg_leave_updated on public.teacher_leave_requests;
create trigger trg_leave_updated before update on public.teacher_leave_requests
  for each row execute function public.set_updated_at();

create table if not exists public.leave_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.teacher_leave_requests(id) on delete cascade,
  decided_by uuid references auth.users(id) on delete set null,
  decision public.leave_status not null,
  note text,
  decided_at timestamptz not null default now(),
  constraint leave_decision_value check (decision in ('approved', 'rejected'))
);

-- ---------------------------------------------------------------------------
-- Chatbot & operations
-- ---------------------------------------------------------------------------
create table if not exists public.chatbot_faqs (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_hi text,
  answer_en text not null,
  answer_hi text,
  tags text[] not null default '{}'::text[],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_faqs_updated on public.chatbot_faqs;
create trigger trg_faqs_updated before update on public.chatbot_faqs
  for each row execute function public.set_updated_at();

create table if not exists public.chatbot_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  enabled boolean not null default true,
  greeting_en text not null default 'Hello! I am Sensei, the school assistant. How can I help you?',
  greeting_hi text not null default 'नमस्ते! मैं सेंसेई हूँ, विद्यालय सहायक। मैं आपकी कैसे मदद कर सकता हूँ?',
  disclaimer_en text not null default 'Please confirm important information directly with the school office.',
  disclaimer_hi text not null default 'कृपया महत्वपूर्ण जानकारी की पुष्टि सीधे विद्यालय कार्यालय से करें।',
  max_input_chars integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists trg_chatbot_settings_updated on public.chatbot_settings;
create trigger trg_chatbot_settings_updated before update on public.chatbot_settings
  for each row execute function public.set_updated_at();

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  purpose text,
  public_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_media_updated on public.media_assets;
create trigger trg_media_updated before update on public.media_assets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit log (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  content_type text,
  record_id uuid,
  class_code text,
  section text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Reject any UPDATE/DELETE, including by privileged roles, at the trigger level.
create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only; % is not permitted', tg_op;
end;
$$;

drop trigger if exists trg_audit_no_update on public.audit_logs;
create trigger trg_audit_no_update before update on public.audit_logs
  for each row execute function public.audit_logs_immutable();

drop trigger if exists trg_audit_no_delete on public.audit_logs;
create trigger trg_audit_no_delete before delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------------------------------------------------------------------------
-- Minimal audit triggers for principal direct-client actions.
-- SECURITY DEFINER so the row is written even though audit_logs blocks
-- ordinary writes. Only non-private metadata is recorded.
-- ---------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec_id uuid;
begin
  begin
    rec_id := (coalesce(new, old)).id;
  exception when others then
    rec_id := null;
  end;

  insert into public.audit_logs (actor_id, actor_role, action, content_type, record_id, detail)
  values (
    auth.uid(),
    public.current_user_role()::text,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    rec_id,
    jsonb_build_object('op', tg_op)
  );
  return null;
end;
$$;

drop trigger if exists trg_audit_timing on public.timing_schedules;
create trigger trg_audit_timing
  after insert or update on public.timing_schedules
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_leave_decision on public.leave_decisions;
create trigger trg_audit_leave_decision
  after insert on public.leave_decisions
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_settings on public.school_settings;
create trigger trg_audit_settings
  after update on public.school_settings
  for each row execute function public.audit_row_change();

drop trigger if exists trg_audit_alert on public.emergency_alerts;
create trigger trg_audit_alert
  after insert or update on public.emergency_alerts
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Retention: force expires_at on insert so the browser cannot bypass it.
-- ---------------------------------------------------------------------------
create or replace function public.set_homework_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  days integer;
begin
  select homework_retention_days into days from public.school_settings limit 1;
  new.expires_at := coalesce(new.created_at, now()) + make_interval(days => coalesce(days, 7));
  return new;
end;
$$;

drop trigger if exists trg_homework_expiry on public.homework_uploads;
create trigger trg_homework_expiry before insert on public.homework_uploads
  for each row execute function public.set_homework_expiry();

create or replace function public.set_class_notice_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  days integer;
begin
  select class_notice_retention_days into days from public.school_settings limit 1;
  new.expires_at := coalesce(new.created_at, now()) + make_interval(days => coalesce(days, 7));
  return new;
end;
$$;

drop trigger if exists trg_class_notice_expiry on public.class_notices;
create trigger trg_class_notice_expiry before insert on public.class_notices
  for each row execute function public.set_class_notice_expiry();

create or replace function public.set_leave_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  days integer;
begin
  select leave_retention_days into days from public.school_settings limit 1;
  new.expires_at := coalesce(new.created_at, now()) + make_interval(days => coalesce(days, 5));
  return new;
end;
$$;

drop trigger if exists trg_leave_expiry on public.teacher_leave_requests;
create trigger trg_leave_expiry before insert on public.teacher_leave_requests
  for each row execute function public.set_leave_expiry();

create or replace function public.set_internal_notice_expiry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  days integer;
begin
  select internal_notice_retention_days into days from public.school_settings limit 1;
  new.expires_at := coalesce(new.created_at, now()) + make_interval(days => coalesce(days, 5));
  return new;
end;
$$;

drop trigger if exists trg_internal_notice_expiry on public.internal_teacher_notices;
create trigger trg_internal_notice_expiry before insert on public.internal_teacher_notices
  for each row execute function public.set_internal_notice_expiry();

-- ---------------------------------------------------------------------------
-- Atomic "publish current spotlight" (unpublishes previous safely)
-- ---------------------------------------------------------------------------
create or replace function public.set_current_spotlight(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_active_teacher()) then
    raise exception 'not authorized';
  end if;

  -- Teachers may only make their own spotlight current; principals may make any.
  if not public.is_principal() then
    if not exists (select 1 from public.student_spotlights where id = p_id and created_by = auth.uid()) then
      raise exception 'not authorized for this record';
    end if;
  end if;

  update public.student_spotlights set is_current = false where is_current = true and id <> p_id;
  update public.student_spotlights set is_current = true, is_published = true where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Useful indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_homework_class on public.homework_uploads (class_code, section);
create index if not exists idx_homework_expires on public.homework_uploads (expires_at);
create index if not exists idx_homework_created_by on public.homework_uploads (created_by);
create index if not exists idx_class_notices_class on public.class_notices (class_code, section);
create index if not exists idx_class_notices_expires on public.class_notices (expires_at);
create index if not exists idx_class_notices_created_by on public.class_notices (created_by);
create index if not exists idx_public_notices_pub on public.public_notices (is_published, effective_at, expiry_at);
create index if not exists idx_calendar_start on public.calendar_events (start_date);
create index if not exists idx_gallery_order on public.gallery_images (sort_order);
create index if not exists idx_resources_vis on public.resources (visibility, is_published);
create index if not exists idx_leave_expires on public.teacher_leave_requests (expires_at);
create index if not exists idx_leave_teacher on public.teacher_leave_requests (teacher_id);
create index if not exists idx_internal_expires on public.internal_teacher_notices (expires_at);
create index if not exists idx_birthday_active on public.birthday_profiles (is_active);
create index if not exists idx_audit_created on public.audit_logs (created_at);
create index if not exists idx_audit_action on public.audit_logs (action);

-- ---------------------------------------------------------------------------
-- Enable RLS on every application table (policies added in 0002_rls.sql).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.school_settings enable row level security;
alter table public.branding_assets enable row level security;
alter table public.timing_schedules enable row level security;
alter table public.emergency_alerts enable row level security;
alter table public.public_notices enable row level security;
alter table public.class_notices enable row level security;
alter table public.calendar_events enable row level security;
alter table public.achievements enable row level security;
alter table public.homework_uploads enable row level security;
alter table public.homework_versions enable row level security;
alter table public.student_spotlights enable row level security;
alter table public.birthday_profiles enable row level security;
alter table public.gallery_images enable row level security;
alter table public.resources enable row level security;
alter table public.parent_messages enable row level security;
alter table public.admission_enquiries enable row level security;
alter table public.internal_teacher_notices enable row level security;
alter table public.internal_notice_reads enable row level security;
alter table public.teacher_leave_requests enable row level security;
alter table public.leave_decisions enable row level security;
alter table public.chatbot_faqs enable row level security;
alter table public.chatbot_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

-- Classes: Nursery (no sections) + Classes 1..10 (sections A & B).
insert into public.classes (code, name_en, name_hi, requires_section, sort_order) values
  ('nursery', 'Nursery', 'नर्सरी', false, 0)
on conflict (code) do nothing;

do $$
declare
  i integer;
begin
  for i in 1..10 loop
    insert into public.classes (code, name_en, name_hi, requires_section, sort_order)
    values (i::text, 'Class ' || i::text, 'कक्षा ' || i::text, true, i)
    on conflict (code) do nothing;
  end loop;
end $$;

-- Sections A & B for classes that require sections.
do $$
declare
  c record;
begin
  for c in select code from public.classes where requires_section loop
    insert into public.sections (class_code, name, sort_order)
    values (c.code, 'A', 0), (c.code, 'B', 1)
    on conflict (class_code, name) do nothing;
  end loop;
end $$;

-- Exactly one school_settings row. Only confirmed facts are seeded.
insert into public.school_settings (
  singleton,
  fee_message_en,
  fee_message_hi,
  default_language,
  timezone,
  admission_mode,
  facilities
) values (
  true,
  'For fee information, please contact the school office directly.',
  'फ़ीस संबंधी जानकारी के लिए कृपया सीधे विद्यालय कार्यालय से संपर्क करें।',
  'en',
  'Asia/Kolkata',
  'closed',
  '[
    {"key": "library", "name_en": "Library", "name_hi": "पुस्तकालय"},
    {"key": "computer_lab", "name_en": "Computer Laboratory", "name_hi": "कंप्यूटर प्रयोगशाला"},
    {"key": "science_lab", "name_en": "Science Laboratory", "name_hi": "विज्ञान प्रयोगशाला"},
    {"key": "playground", "name_en": "Playground", "name_hi": "खेल का मैदान"},
    {"key": "transport", "name_en": "School Transport", "name_hi": "विद्यालय परिवहन"},
    {"key": "cctv", "name_en": "CCTV and Security", "name_hi": "सीसीटीवी एवं सुरक्षा"},
    {"key": "drinking_water", "name_en": "Clean Drinking Water", "name_hi": "स्वच्छ पेयजल"}
  ]'::jsonb
)
on conflict (singleton) do nothing;

-- School name defaults (confirmed name of the school).
update public.school_settings
  set name_en = coalesce(name_en, 'View Point Public School')
  where singleton;

-- Branding asset slots (paths left blank until the principal uploads media).
insert into public.branding_assets (key, bucket) values
  ('logo', 'branding'),
  ('favicon', 'branding'),
  ('hero', 'branding'),
  ('principal_photo', 'branding'),
  ('about_photo', 'branding'),
  ('og_image', 'branding'),
  ('fallback', 'branding')
on conflict (key) do nothing;

-- Timing schedules (Section 3 of the specification).
insert into public.timing_schedules (scope, shift, start_time, end_time, classes_en, classes_hi, is_active) values
  ('mon_fri', 'morning', '06:00', '10:00', 'Nursery, Classes 1-3, and Classes 9-10', 'नर्सरी, कक्षा 1-3 और कक्षा 9-10', true),
  ('mon_fri', 'day', '10:10', '15:00', 'Classes 4-8', 'कक्षा 4-8', true),
  ('saturday', 'morning', '06:00', '08:30', 'Nursery, Classes 1-3, and Classes 9-10', 'नर्सरी, कक्षा 1-3 और कक्षा 9-10', true),
  ('saturday', 'day', '10:10', '13:00', 'Classes 4-8', 'कक्षा 4-8', true)
on conflict do nothing;

-- One chatbot settings row.
insert into public.chatbot_settings (singleton) values (true)
on conflict (singleton) do nothing;
