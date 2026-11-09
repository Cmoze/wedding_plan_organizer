-- Lets a task be assigned to someone who's been invited but hasn't joined yet. A task has
-- either a real assignee (assignee_id) or a pending one (invite_id), not both; accepting
-- the invite auto-promotes any tasks pointing at it to the new member, so "assign this to
-- Callie" today just works the moment she joins.

alter table public.tasks
  add column invite_id uuid references public.invites (id) on delete set null;

-- tasks_before_write (see the rls migration) blocks a helper from changing anything but
-- their task's status/notes, checked via auth.uid() — which still reflects the real caller
-- even inside accept_invite's security definer, not the function owner. Without this, a
-- helper's own invite acceptance would trip that guard while reassigning their pending
-- tasks. app.bypass_task_guard is a transaction-local escape hatch for that one case.
create or replace function private.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed text[] := array['status', 'notes', 'completed_at', 'updated_at'];
begin
  if tg_op = 'UPDATE'
    and (select auth.uid()) is not null
    and coalesce(current_setting('app.bypass_task_guard', true), '') <> 'on'
    and not private.can_edit(old.wedding_id)
    and (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed)
  then
    raise exception 'Helpers can only change the status and notes of their tasks'
      using errcode = '42501';
  end if;

  if new.status in ('done', 'booked') then
    if tg_op = 'INSERT' or old.status not in ('done', 'booked') then
      new.completed_at = coalesce(new.completed_at, now());
    end if;
  else
    new.completed_at = null;
  end if;

  return new;
end;
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
  _member_id uuid;
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

  select id into _member_id from public.members
  where wedding_id = _invite.wedding_id and user_id = _uid;

  perform set_config('app.bypass_task_guard', 'on', true);
  update public.tasks set assignee_id = _member_id, invite_id = null
  where invite_id = _invite.id;

  update public.invites set accepted_at = now(), accepted_by = _uid where id = _invite.id;

  return _invite.wedding_id;
end;
$$;
