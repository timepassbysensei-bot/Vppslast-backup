-- =========================================================================
-- ⚠️  DANGER — DESTRUCTIVE RESET  ⚠️
-- =========================================================================
-- This file DROPS every application table, type, function, and trigger created
-- by this project, and removes the project's Storage buckets.
--
-- It DOES NOT delete auth.users. Your login accounts remain.
--
-- DO NOT run this unless you truly want to wipe all school content and start
-- over. It is never executed automatically. After running it, run
-- supabase/setup-all.sql again to recreate a clean schema.
--
-- To use: read carefully, then paste the WHOLE file into the Supabase SQL
-- Editor and run it.
-- =========================================================================

-- Remove Storage objects and buckets created by this project.
delete from storage.objects where bucket_id in (
  'branding','notices','homework','gallery','spotlight','resources-public','birthday',
  'resources-private','parent-attachments','leave-attachments','internal-notices'
);
delete from storage.buckets where id in (
  'branding','notices','homework','gallery','spotlight','resources-public','birthday',
  'resources-private','parent-attachments','leave-attachments','internal-notices'
);

-- Drop the signup trigger on auth.users (leaves auth.users itself intact).
drop trigger if exists on_auth_user_created on auth.users;

-- Drop application tables (CASCADE clears dependent objects & policies).
drop table if exists public.audit_logs cascade;
drop table if exists public.media_assets cascade;
drop table if exists public.chatbot_settings cascade;
drop table if exists public.chatbot_faqs cascade;
drop table if exists public.leave_decisions cascade;
drop table if exists public.teacher_leave_requests cascade;
drop table if exists public.internal_notice_reads cascade;
drop table if exists public.internal_teacher_notices cascade;
drop table if exists public.admission_enquiries cascade;
drop table if exists public.parent_messages cascade;
drop table if exists public.resources cascade;
drop table if exists public.gallery_images cascade;
drop table if exists public.birthday_profiles cascade;
drop table if exists public.student_spotlights cascade;
drop table if exists public.homework_versions cascade;
drop table if exists public.homework_uploads cascade;
drop table if exists public.achievements cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.class_notices cascade;
drop table if exists public.public_notices cascade;
drop table if exists public.emergency_alerts cascade;
drop table if exists public.timing_schedules cascade;
drop table if exists public.branding_assets cascade;
drop table if exists public.school_settings cascade;
drop table if exists public.sections cascade;
drop table if exists public.classes cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.profiles cascade;

-- Legacy/obsolete tables (if present).
drop table if exists public.teacher_class_assignments cascade;
drop table if exists public.teacher_permissions cascade;

-- Drop helper functions.
drop function if exists public.set_current_spotlight(uuid) cascade;
drop function if exists public.owns_record(uuid) cascade;
drop function if exists public.is_active_teacher() cascade;
drop function if exists public.is_principal() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.current_user_status() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.audit_row_change() cascade;
drop function if exists public.audit_logs_immutable() cascade;
drop function if exists public.set_homework_expiry() cascade;
drop function if exists public.set_class_notice_expiry() cascade;
drop function if exists public.set_leave_expiry() cascade;
drop function if exists public.set_internal_notice_expiry() cascade;
drop function if exists public.list_expired_homework(integer) cascade;
drop function if exists public.list_expired_class_notices(integer) cascade;
drop function if exists public.list_expired_leave(integer) cascade;
drop function if exists public.list_expired_internal_notices(integer) cascade;
drop function if exists public.delete_homework_rows(uuid[]) cascade;
drop function if exists public.delete_class_notice_rows(uuid[]) cascade;
drop function if exists public.delete_leave_rows(uuid[]) cascade;
drop function if exists public.delete_internal_notice_rows(uuid[]) cascade;

-- Drop enums.
drop type if exists public.alert_severity cascade;
drop type if exists public.message_status cascade;
drop type if exists public.leave_status cascade;
drop type if exists public.resource_visibility cascade;
drop type if exists public.birthday_publish_mode cascade;
drop type if exists public.notice_priority cascade;
drop type if exists public.user_status cascade;
drop type if exists public.user_role cascade;
