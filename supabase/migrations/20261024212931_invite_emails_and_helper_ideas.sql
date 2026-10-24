-- Invites are addressed to one email, and only that account can use them.
-- Helpers can contribute ideas (boards, items, photos) and manage what they added.

-- invites ---------------------------------------------------------------------

alter table public.invites
  add column email text check (email is null or email = lower(trim(email))),
  add column accepted_at timestamptz,
  add column accepted_by uuid references auth.users (id) on delete set null;
create index invites_accepted_by_idx on public.invites (accepted_by);

-- The return type changes, so the function has to be recreated.
drop function public.get_invite(uuid);
create function public.get_invite(_token uuid)
returns table (
  wedding_id uuid,
  partner1_name text,
  partner2_name text,
  wedding_date date,
  role public.member_role,
  email text,
  expired boolean,
  accepted boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.partner1_name, w.partner2_name, w.wedding_date, i.role, i.email,
    i.expires_at < now(), i.accepted_at is not null
  from public.invites i
  join public.weddings w on w.id = i.wedding_id
  where i.token = _token;
$$;

create or replace function public.accept_invite(_token uuid, _display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := (select auth.uid());
  _invite public.invites;
  _email text;
begin
  if _uid is null then
    raise exception 'You must be signed in to accept an invite' using errcode = '42501';
  end if;

  select * into _invite from public.invites where token = _token for update;
  if not found then
    raise exception 'This invite link is not valid' using errcode = 'P0002';
  end if;

  -- Accepting twice is fine; someone else reusing the link is not.
  if _invite.accepted_by = _uid then
    return _invite.wedding_id;
  end if;
  if _invite.accepted_at is not null then
    raise exception 'This invite has already been used' using errcode = '22023';
  end if;
  if _invite.expires_at < now() then
    raise exception 'This invite link has expired' using errcode = '22023';
  end if;

  select lower(email) into _email from auth.users where id = _uid;
  if _invite.email is not null and _invite.email is distinct from _email then
    raise exception 'This invite was sent to %. Log in with that email to accept it.', _invite.email
      using errcode = '42501';
  end if;

  insert into public.members (wedding_id, user_id, role, display_name)
  values (
    _invite.wedding_id, _uid, _invite.role,
    coalesce(nullif(trim(_display_name), ''), split_part(_email, '@', 1), '')
  )
  on conflict (wedding_id, user_id) do nothing;

  update public.invites set accepted_at = now(), accepted_by = _uid where id = _invite.id;

  return _invite.wedding_id;
end;
$$;

revoke execute on function public.get_invite(uuid) from public;
grant execute on function public.get_invite(uuid) to anon, authenticated;

-- ideas: any member adds; the author or an editor changes and deletes -----------

do $$
declare
  t text;
begin
  foreach t in array array['idea_boards', 'idea_items']
  loop
    execute format('drop policy "editors can insert" on public.%I', t);
    execute format('drop policy "editors can update" on public.%I', t);
    execute format('drop policy "editors can delete" on public.%I', t);
    execute format(
      'create policy "members can add as themselves" on public.%I for insert to authenticated
         with check ((select private.is_member(wedding_id)) and created_by = (select auth.uid()))', t);
    execute format(
      'create policy "authors and editors can update" on public.%I for update to authenticated
         using ((select private.can_edit(wedding_id)) or created_by = (select auth.uid()))
         with check ((select private.is_member(wedding_id))
           and ((select private.can_edit(wedding_id)) or created_by = (select auth.uid())))', t);
    execute format(
      'create policy "authors and editors can delete" on public.%I for delete to authenticated
         using ((select private.can_edit(wedding_id)) or created_by = (select auth.uid()))', t);
  end loop;
end;
$$;

drop policy "idea photos: editors can upload" on storage.objects;
drop policy "idea photos: editors can replace" on storage.objects;
drop policy "idea photos: editors can delete" on storage.objects;

create policy "idea photos: members can upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'idea-photos' and (select private.is_member(private.path_wedding_id(name))));
create policy "idea photos: uploader or editors can replace" on storage.objects for update to authenticated
  using (
    bucket_id = 'idea-photos'
    and ((select private.can_edit(private.path_wedding_id(name))) or owner_id = (select auth.uid())::text)
  )
  with check (
    bucket_id = 'idea-photos'
    and (select private.is_member(private.path_wedding_id(name)))
    and ((select private.can_edit(private.path_wedding_id(name))) or owner_id = (select auth.uid())::text)
  );
create policy "idea photos: uploader or editors can delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'idea-photos'
    and ((select private.can_edit(private.path_wedding_id(name))) or owner_id = (select auth.uid())::text)
  );
