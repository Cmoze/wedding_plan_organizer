-- One account (the builder's own) can read and write every wedding, for debugging and
-- demos. It never gets a visible `members` row anywhere: every check that already gates
-- access on membership (is_member, has_role, and everything built on them) now also
-- passes for this one email, so no policy outside this file needs to change.
--
-- To change who this is, update the email literal in private.is_platform_admin below and
-- run this migration again (create or replace keeps the same grants).

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.jwt() ->> 'email') = 'cartermoser4@gmail.com';
$$;

revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function private.is_member(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin() or exists (
    select 1 from public.members m
    where m.wedding_id = _wedding_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_role(_wedding_id uuid, _roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin() or exists (
    select 1 from public.members m
    where m.wedding_id = _wedding_id
      and m.user_id = (select auth.uid())
      and m.role = any (_roles)
  );
$$;

grant execute on function
  private.is_member(uuid),
  private.has_role(uuid, public.member_role[])
to authenticated;
