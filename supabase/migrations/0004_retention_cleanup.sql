-- =========================================================================
-- View Point Public School — 0004_retention_cleanup.sql
-- Retention helpers used by the Netlify scheduled `retention-cleanup` function.
--
-- The single source of truth for "what is expired" lives here. The scheduled
-- function calls these SECURITY DEFINER functions with the service role to:
--   1. fetch a bounded batch of expired rows + their exact storage paths,
--   2. delete the storage objects,
--   3. delete the database rows (ON DELETE CASCADE removes dependent rows:
--      homework_versions, internal_notice_reads, leave_decisions),
--   4. write a minimal aggregate audit event.
--
-- Everything is idempotent: rows already gone simply return no work.
-- Run AFTER 0003_storage.sql.
-- =========================================================================

-- Confirm cleanup indexes exist (also declared in 0001; safe to repeat).
create index if not exists idx_homework_expires on public.homework_uploads (expires_at);
create index if not exists idx_class_notices_expires on public.class_notices (expires_at);
create index if not exists idx_leave_expires on public.teacher_leave_requests (expires_at);
create index if not exists idx_internal_expires on public.internal_teacher_notices (expires_at);

-- ---------------------------------------------------------------------------
-- Expired-batch readers. Bounded by p_limit so a single run never times out.
-- ---------------------------------------------------------------------------
create or replace function public.list_expired_homework(p_limit integer default 200)
returns table (id uuid, image_paths text[])
language sql
stable
security definer
set search_path = public
as $$
  select id, image_paths
  from public.homework_uploads
  where expires_at <= now()
  order by expires_at
  limit greatest(1, least(p_limit, 1000));
$$;

create or replace function public.list_expired_class_notices(p_limit integer default 200)
returns table (id uuid, attachment_bucket text, attachment_path text)
language sql
stable
security definer
set search_path = public
as $$
  select id, attachment_bucket, attachment_path
  from public.class_notices
  where expires_at <= now()
  order by expires_at
  limit greatest(1, least(p_limit, 1000));
$$;

create or replace function public.list_expired_leave(p_limit integer default 200)
returns table (id uuid, attachment_bucket text, attachment_path text)
language sql
stable
security definer
set search_path = public
as $$
  select id, attachment_bucket, attachment_path
  from public.teacher_leave_requests
  where expires_at <= now()
  order by expires_at
  limit greatest(1, least(p_limit, 1000));
$$;

create or replace function public.list_expired_internal_notices(p_limit integer default 200)
returns table (id uuid, attachment_bucket text, attachment_path text)
language sql
stable
security definer
set search_path = public
as $$
  select id, attachment_bucket, attachment_path
  from public.internal_teacher_notices
  where expires_at <= now()
  order by expires_at
  limit greatest(1, least(p_limit, 1000));
$$;

-- ---------------------------------------------------------------------------
-- Row deleters by explicit id list (idempotent). Storage is removed by the
-- function BEFORE these are called. Dependent rows disappear via CASCADE.
-- ---------------------------------------------------------------------------
create or replace function public.delete_homework_rows(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.homework_uploads where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.delete_class_notice_rows(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.class_notices where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.delete_leave_rows(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.teacher_leave_requests where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.delete_internal_notice_rows(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.internal_teacher_notices where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Least privilege: only the service role may run cleanup helpers.
-- ---------------------------------------------------------------------------
revoke execute on function public.list_expired_homework(integer) from public;
revoke execute on function public.list_expired_class_notices(integer) from public;
revoke execute on function public.list_expired_leave(integer) from public;
revoke execute on function public.list_expired_internal_notices(integer) from public;
revoke execute on function public.delete_homework_rows(uuid[]) from public;
revoke execute on function public.delete_class_notice_rows(uuid[]) from public;
revoke execute on function public.delete_leave_rows(uuid[]) from public;
revoke execute on function public.delete_internal_notice_rows(uuid[]) from public;

grant execute on function public.list_expired_homework(integer) to service_role;
grant execute on function public.list_expired_class_notices(integer) to service_role;
grant execute on function public.list_expired_leave(integer) to service_role;
grant execute on function public.list_expired_internal_notices(integer) to service_role;
grant execute on function public.delete_homework_rows(uuid[]) to service_role;
grant execute on function public.delete_class_notice_rows(uuid[]) to service_role;
grant execute on function public.delete_leave_rows(uuid[]) to service_role;
grant execute on function public.delete_internal_notice_rows(uuid[]) to service_role;
