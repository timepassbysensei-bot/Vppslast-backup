-- =========================================================================
-- View Point Public School — 0002_rls.sql
-- Row Level Security policies + least-privilege grants.
-- Default posture: deny. Every allowance is explicit.
-- Run AFTER 0001_schema.sql.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Table privileges. RLS is the real gate; these GRANTs simply let the
-- policies be evaluated. DELETE is intentionally NOT granted to end users —
-- all permanent deletions run through the service-role delete function.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Function execution: revoke broad PUBLIC execute, grant only what clients need.
-- ---------------------------------------------------------------------------
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.audit_logs_immutable() from public;
revoke execute on function public.audit_row_change() from public;
revoke execute on function public.set_homework_expiry() from public;
revoke execute on function public.set_class_notice_expiry() from public;
revoke execute on function public.set_leave_expiry() from public;
revoke execute on function public.set_internal_notice_expiry() from public;

revoke execute on function public.is_principal() from public;
revoke execute on function public.is_active_teacher() from public;
revoke execute on function public.owns_record(uuid) from public;
revoke execute on function public.current_user_status() from public;
revoke execute on function public.current_user_role() from public;
revoke execute on function public.set_current_spotlight(uuid) from public;

grant execute on function public.is_principal() to authenticated;
grant execute on function public.is_active_teacher() to authenticated;
grant execute on function public.owns_record(uuid) to authenticated;
grant execute on function public.current_user_status() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.set_current_spotlight(uuid) to authenticated;

-- =========================================================================
-- profiles
-- =========================================================================
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_principal());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- =========================================================================
-- user_roles — authoritative role table.
-- Users may read ONLY their own row (for routing). Principal may read all.
-- No UPDATE/INSERT/DELETE policy: only the service-role function may mutate.
-- =========================================================================
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_principal());

-- =========================================================================
-- classes & sections — public reference data (read-only for everyone).
-- =========================================================================
drop policy if exists classes_read on public.classes;
create policy classes_read on public.classes
  for select to anon, authenticated using (true);

drop policy if exists sections_read on public.sections;
create policy sections_read on public.sections
  for select to anon, authenticated using (true);

-- =========================================================================
-- school_settings — public read; principal update only.
-- =========================================================================
drop policy if exists settings_read on public.school_settings;
create policy settings_read on public.school_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_update on public.school_settings;
create policy settings_update on public.school_settings
  for update to authenticated
  using (public.is_principal())
  with check (public.is_principal());

-- =========================================================================
-- branding_assets — public read; principal manage.
-- =========================================================================
drop policy if exists branding_read on public.branding_assets;
create policy branding_read on public.branding_assets
  for select to anon, authenticated using (true);

drop policy if exists branding_insert on public.branding_assets;
create policy branding_insert on public.branding_assets
  for insert to authenticated with check (public.is_principal());

drop policy if exists branding_update on public.branding_assets;
create policy branding_update on public.branding_assets
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- timing_schedules — public read; principal manage.
-- =========================================================================
drop policy if exists timing_read on public.timing_schedules;
create policy timing_read on public.timing_schedules
  for select to anon, authenticated using (true);

drop policy if exists timing_insert on public.timing_schedules;
create policy timing_insert on public.timing_schedules
  for insert to authenticated with check (public.is_principal());

drop policy if exists timing_update on public.timing_schedules;
create policy timing_update on public.timing_schedules
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- emergency_alerts — public read; principal manage.
-- =========================================================================
drop policy if exists alerts_read on public.emergency_alerts;
create policy alerts_read on public.emergency_alerts
  for select to anon, authenticated using (true);

drop policy if exists alerts_insert on public.emergency_alerts;
create policy alerts_insert on public.emergency_alerts
  for insert to authenticated with check (public.is_principal());

drop policy if exists alerts_update on public.emergency_alerts;
create policy alerts_update on public.emergency_alerts
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- public_notices — public read published/effective/non-expired; principal manage.
-- =========================================================================
drop policy if exists public_notices_read on public.public_notices;
create policy public_notices_read on public.public_notices
  for select to anon, authenticated
  using (
    is_published
    and effective_at <= now()
    and (expiry_at is null or expiry_at > now())
  );

drop policy if exists public_notices_principal_read on public.public_notices;
create policy public_notices_principal_read on public.public_notices
  for select to authenticated using (public.is_principal());

drop policy if exists public_notices_insert on public.public_notices;
create policy public_notices_insert on public.public_notices
  for insert to authenticated with check (public.is_principal());

drop policy if exists public_notices_update on public.public_notices;
create policy public_notices_update on public.public_notices
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- class_notices — public read published/non-expired; staff read non-expired;
-- owner or principal write. Expired rows disappear immediately (before cleanup).
-- =========================================================================
drop policy if exists class_notices_public_read on public.class_notices;
create policy class_notices_public_read on public.class_notices
  for select to anon, authenticated
  using (is_published and expires_at > now());

drop policy if exists class_notices_staff_read on public.class_notices;
create policy class_notices_staff_read on public.class_notices
  for select to authenticated
  using (public.is_principal() or (public.is_active_teacher() and expires_at > now()));

drop policy if exists class_notices_insert on public.class_notices;
create policy class_notices_insert on public.class_notices
  for insert to authenticated
  with check (public.is_active_teacher() and created_by = auth.uid());

drop policy if exists class_notices_update on public.class_notices;
create policy class_notices_update on public.class_notices
  for update to authenticated
  using (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()))
  with check (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()));

-- =========================================================================
-- calendar_events — public read published; principal manage.
-- =========================================================================
drop policy if exists calendar_public_read on public.calendar_events;
create policy calendar_public_read on public.calendar_events
  for select to anon, authenticated using (is_published);

drop policy if exists calendar_principal_read on public.calendar_events;
create policy calendar_principal_read on public.calendar_events
  for select to authenticated using (public.is_principal());

drop policy if exists calendar_insert on public.calendar_events;
create policy calendar_insert on public.calendar_events
  for insert to authenticated with check (public.is_principal());

drop policy if exists calendar_update on public.calendar_events;
create policy calendar_update on public.calendar_events
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- achievements — public read published; principal manage.
-- =========================================================================
drop policy if exists achievements_public_read on public.achievements;
create policy achievements_public_read on public.achievements
  for select to anon, authenticated using (is_published);

drop policy if exists achievements_principal_read on public.achievements;
create policy achievements_principal_read on public.achievements
  for select to authenticated using (public.is_principal());

drop policy if exists achievements_insert on public.achievements;
create policy achievements_insert on public.achievements
  for insert to authenticated with check (public.is_principal());

drop policy if exists achievements_update on public.achievements;
create policy achievements_update on public.achievements
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- homework_uploads — public read published/non-expired; staff read non-expired;
-- teacher creates own; owner or principal updates.
-- =========================================================================
drop policy if exists homework_public_read on public.homework_uploads;
create policy homework_public_read on public.homework_uploads
  for select to anon, authenticated
  using (is_published and expires_at > now());

drop policy if exists homework_staff_read on public.homework_uploads;
create policy homework_staff_read on public.homework_uploads
  for select to authenticated
  using (public.is_principal() or (public.is_active_teacher() and expires_at > now()));

drop policy if exists homework_insert on public.homework_uploads;
create policy homework_insert on public.homework_uploads
  for insert to authenticated
  with check (public.is_active_teacher() and created_by = auth.uid());

drop policy if exists homework_update on public.homework_uploads;
create policy homework_update on public.homework_uploads
  for update to authenticated
  using (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()))
  with check (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()));

-- =========================================================================
-- homework_versions — staff-only history (owner of parent homework or principal).
-- =========================================================================
drop policy if exists homework_versions_read on public.homework_versions;
create policy homework_versions_read on public.homework_versions
  for select to authenticated
  using (
    public.is_principal()
    or exists (
      select 1 from public.homework_uploads h
      where h.id = homework_versions.homework_id and h.created_by = auth.uid()
    )
  );

drop policy if exists homework_versions_insert on public.homework_versions;
create policy homework_versions_insert on public.homework_versions
  for insert to authenticated
  with check (
    public.is_principal()
    or exists (
      select 1 from public.homework_uploads h
      where h.id = homework_versions.homework_id and h.created_by = auth.uid()
    )
  );

-- =========================================================================
-- student_spotlights — public read current+published; staff manage own; principal all.
-- =========================================================================
drop policy if exists spotlight_public_read on public.student_spotlights;
create policy spotlight_public_read on public.student_spotlights
  for select to anon, authenticated
  using (is_published and is_current);

drop policy if exists spotlight_staff_read on public.student_spotlights;
create policy spotlight_staff_read on public.student_spotlights
  for select to authenticated
  using (public.is_active_teacher());

drop policy if exists spotlight_insert on public.student_spotlights;
create policy spotlight_insert on public.student_spotlights
  for insert to authenticated
  with check (public.is_active_teacher() and created_by = auth.uid());

drop policy if exists spotlight_update on public.student_spotlights;
create policy spotlight_update on public.student_spotlights
  for update to authenticated
  using (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()))
  with check (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()));

-- =========================================================================
-- birthday_profiles — NEVER anon-readable. Staff read own; principal all.
-- Public "today" data comes only from the birthdays-today service function.
-- =========================================================================
drop policy if exists birthday_staff_read on public.birthday_profiles;
create policy birthday_staff_read on public.birthday_profiles
  for select to authenticated
  using (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()));

drop policy if exists birthday_insert on public.birthday_profiles;
create policy birthday_insert on public.birthday_profiles
  for insert to authenticated
  with check (public.is_active_teacher() and created_by = auth.uid());

drop policy if exists birthday_update on public.birthday_profiles;
create policy birthday_update on public.birthday_profiles
  for update to authenticated
  using (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()))
  with check (public.is_principal() or (public.is_active_teacher() and created_by = auth.uid()));

-- =========================================================================
-- gallery_images — public read published; principal manage.
-- =========================================================================
drop policy if exists gallery_public_read on public.gallery_images;
create policy gallery_public_read on public.gallery_images
  for select to anon, authenticated using (is_published);

drop policy if exists gallery_principal_read on public.gallery_images;
create policy gallery_principal_read on public.gallery_images
  for select to authenticated using (public.is_principal());

drop policy if exists gallery_insert on public.gallery_images;
create policy gallery_insert on public.gallery_images
  for insert to authenticated with check (public.is_principal());

drop policy if exists gallery_update on public.gallery_images;
create policy gallery_update on public.gallery_images
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- resources — public read published+public; staff read metadata; principal manage.
-- Private files are served only via short-lived signed URLs (signed-file fn).
-- =========================================================================
drop policy if exists resources_public_read on public.resources;
create policy resources_public_read on public.resources
  for select to anon, authenticated
  using (visibility = 'public' and is_published);

drop policy if exists resources_staff_read on public.resources;
create policy resources_staff_read on public.resources
  for select to authenticated
  using (public.is_principal() or (public.is_active_teacher() and is_published));

drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
  for insert to authenticated with check (public.is_principal());

drop policy if exists resources_update on public.resources;
create policy resources_update on public.resources
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- parent_messages — principal-only read/update. Inserts only via service role.
-- =========================================================================
drop policy if exists parent_messages_principal_read on public.parent_messages;
create policy parent_messages_principal_read on public.parent_messages
  for select to authenticated using (public.is_principal());

drop policy if exists parent_messages_principal_update on public.parent_messages;
create policy parent_messages_principal_update on public.parent_messages
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- admission_enquiries — principal-only read/update. Inserts only via service role.
-- =========================================================================
drop policy if exists admission_principal_read on public.admission_enquiries;
create policy admission_principal_read on public.admission_enquiries
  for select to authenticated using (public.is_principal());

drop policy if exists admission_principal_update on public.admission_enquiries;
create policy admission_principal_update on public.admission_enquiries
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- internal_teacher_notices — staff read non-expired; principal manage.
-- =========================================================================
drop policy if exists internal_notices_staff_read on public.internal_teacher_notices;
create policy internal_notices_staff_read on public.internal_teacher_notices
  for select to authenticated
  using (public.is_principal() or (public.is_active_teacher() and expires_at > now()));

drop policy if exists internal_notices_insert on public.internal_teacher_notices;
create policy internal_notices_insert on public.internal_teacher_notices
  for insert to authenticated with check (public.is_principal());

drop policy if exists internal_notices_update on public.internal_teacher_notices;
create policy internal_notices_update on public.internal_teacher_notices
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- internal_notice_reads — teacher marks own read; principal sees all.
-- =========================================================================
drop policy if exists internal_reads_select on public.internal_notice_reads;
create policy internal_reads_select on public.internal_notice_reads
  for select to authenticated
  using (public.is_principal() or teacher_id = auth.uid());

drop policy if exists internal_reads_insert on public.internal_notice_reads;
create policy internal_reads_insert on public.internal_notice_reads
  for insert to authenticated
  with check (
    public.is_active_teacher()
    and teacher_id = auth.uid()
    and exists (
      select 1 from public.internal_teacher_notices n
      where n.id = internal_notice_reads.notice_id and n.expires_at > now()
    )
  );

-- =========================================================================
-- teacher_leave_requests — owner reads/creates/cancels own; principal reads/updates all.
-- =========================================================================
drop policy if exists leave_select on public.teacher_leave_requests;
create policy leave_select on public.teacher_leave_requests
  for select to authenticated
  using (public.is_principal() or teacher_id = auth.uid());

drop policy if exists leave_insert on public.teacher_leave_requests;
create policy leave_insert on public.teacher_leave_requests
  for insert to authenticated
  with check (public.is_active_teacher() and teacher_id = auth.uid());

drop policy if exists leave_update on public.teacher_leave_requests;
create policy leave_update on public.teacher_leave_requests
  for update to authenticated
  using (public.is_principal() or teacher_id = auth.uid())
  with check (public.is_principal() or teacher_id = auth.uid());

-- =========================================================================
-- leave_decisions — owner of the request may read; principal reads/creates.
-- =========================================================================
drop policy if exists leave_decisions_select on public.leave_decisions;
create policy leave_decisions_select on public.leave_decisions
  for select to authenticated
  using (
    public.is_principal()
    or exists (
      select 1 from public.teacher_leave_requests r
      where r.id = leave_decisions.request_id and r.teacher_id = auth.uid()
    )
  );

drop policy if exists leave_decisions_insert on public.leave_decisions;
create policy leave_decisions_insert on public.leave_decisions
  for insert to authenticated
  with check (public.is_principal() and decided_by = auth.uid());

-- =========================================================================
-- chatbot_faqs — public read active; principal manage.
-- =========================================================================
drop policy if exists faqs_public_read on public.chatbot_faqs;
create policy faqs_public_read on public.chatbot_faqs
  for select to anon, authenticated using (is_active);

drop policy if exists faqs_principal_read on public.chatbot_faqs;
create policy faqs_principal_read on public.chatbot_faqs
  for select to authenticated using (public.is_principal());

drop policy if exists faqs_insert on public.chatbot_faqs;
create policy faqs_insert on public.chatbot_faqs
  for insert to authenticated with check (public.is_principal());

drop policy if exists faqs_update on public.chatbot_faqs;
create policy faqs_update on public.chatbot_faqs
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- chatbot_settings — public read (non-secret); principal update.
-- =========================================================================
drop policy if exists chatbot_settings_read on public.chatbot_settings;
create policy chatbot_settings_read on public.chatbot_settings
  for select to anon, authenticated using (true);

drop policy if exists chatbot_settings_update on public.chatbot_settings;
create policy chatbot_settings_update on public.chatbot_settings
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- media_assets — principal manage; public read (public_url only).
-- =========================================================================
drop policy if exists media_read on public.media_assets;
create policy media_read on public.media_assets
  for select to anon, authenticated using (true);

drop policy if exists media_insert on public.media_assets;
create policy media_insert on public.media_assets
  for insert to authenticated with check (public.is_principal());

drop policy if exists media_update on public.media_assets;
create policy media_update on public.media_assets
  for update to authenticated using (public.is_principal()) with check (public.is_principal());

-- =========================================================================
-- audit_logs — principal read only. No insert/update/delete policy for clients.
-- Service role inserts; SECURITY DEFINER triggers insert; immutability trigger
-- blocks all UPDATE/DELETE regardless of role.
-- =========================================================================
drop policy if exists audit_principal_read on public.audit_logs;
create policy audit_principal_read on public.audit_logs
  for select to authenticated using (public.is_principal());
