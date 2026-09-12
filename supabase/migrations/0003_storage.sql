-- =========================================================================
-- View Point Public School — 0003_storage.sql
-- Storage buckets + Storage RLS policies.
-- Private buckets have NO select policy: direct reads are impossible; files
-- are served only through the service-role signed-file function.
-- Run AFTER 0002_rls.sql.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Buckets. Images: JPEG/PNG/WebP. Documents: PDF. SVG/HTML/scripts rejected.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('branding',          'branding',          true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('notices',           'notices',           true,  10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('homework',          'homework',          true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('gallery',           'gallery',           true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('spotlight',         'spotlight',         true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('resources-public',  'resources-public',  true,  10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('birthday',          'birthday',          true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('resources-private', 'resources-private', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('parent-attachments','parent-attachments',false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('leave-attachments', 'leave-attachments', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('internal-notices',  'internal-notices',  false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Public bucket read policies (listing). Direct public URLs also work.
-- ---------------------------------------------------------------------------
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('branding','notices','homework','gallery','spotlight','resources-public','birthday'));

-- ---------------------------------------------------------------------------
-- Teacher uploads to owner-scoped folders: homework/{uid}/..., birthday/{uid}/...,
-- spotlight/{uid}/..., notices/{uid}/... (class-notice attachments).
-- ---------------------------------------------------------------------------
drop policy if exists storage_teacher_insert on storage.objects;
create policy storage_teacher_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('homework','birthday','spotlight','notices')
    and public.is_active_teacher()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_teacher_delete on storage.objects;
create policy storage_teacher_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('homework','birthday','spotlight','notices')
    and (
      public.is_principal()
      or (public.is_active_teacher() and (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

-- Teacher uploads private leave attachments to leave-attachments/{uid}/...
drop policy if exists storage_leave_insert on storage.objects;
create policy storage_leave_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'leave-attachments'
    and public.is_active_teacher()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_leave_delete on storage.objects;
create policy storage_leave_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'leave-attachments'
    and (
      public.is_principal()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- Principal-managed buckets: gallery, branding, resources-public,
-- resources-private, internal-notices.
-- ---------------------------------------------------------------------------
drop policy if exists storage_principal_insert on storage.objects;
create policy storage_principal_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('gallery','branding','resources-public','resources-private','internal-notices')
    and public.is_principal()
  );

drop policy if exists storage_principal_update on storage.objects;
create policy storage_principal_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('gallery','branding','resources-public','resources-private','internal-notices')
    and public.is_principal()
  )
  with check (
    bucket_id in ('gallery','branding','resources-public','resources-private','internal-notices')
    and public.is_principal()
  );

drop policy if exists storage_principal_delete on storage.objects;
create policy storage_principal_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('gallery','branding','resources-public','resources-private','internal-notices')
    and public.is_principal()
  );

-- NOTE: parent-attachments has no client policy at all. Objects there are
-- written/read only by the service role (signed-file / functions). Likewise,
-- reads of resources-private, leave-attachments, and internal-notices are
-- performed only via short-lived signed URLs minted by the service role.
