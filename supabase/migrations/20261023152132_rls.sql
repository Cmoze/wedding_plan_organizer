-- Row Level Security. See the permissions table in docs/DATA_MODEL.md.
-- Membership checks are security definer functions in the unexposed `private` schema so
-- policies on `members` don't recurse into themselves.

create function private.is_member(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.wedding_id = _wedding_id and m.user_id = (select auth.uid())
  );
$$;

create function private.has_role(_wedding_id uuid, _roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.wedding_id = _wedding_id
      and m.user_id = (select auth.uid())
      and m.role = any (_roles)
  );
$$;

create function private.can_edit(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(_wedding_id, array['couple', 'planner']::public.member_role[]);
$$;

create function private.is_couple(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(_wedding_id, array['couple']::public.member_role[]);
$$;

create function private.is_assignee(_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.id = _member_id and m.user_id = (select auth.uid())
  );
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function
  private.is_member(uuid),
  private.has_role(uuid, public.member_role[]),
  private.can_edit(uuid),
  private.is_couple(uuid),
  private.is_assignee(uuid)
to authenticated;

-- enable RLS everywhere -----------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'weddings', 'members', 'invites', 'checklist_templates', 'vendors', 'tasks', 'events',
    'budget_items', 'households', 'guests', 'idea_boards', 'idea_items', 'comments',
    'reactions', 'emails', 'activity', 'registry_links'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- tables where members read and couple/planner write -------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'vendors', 'events', 'budget_items', 'households', 'guests', 'idea_boards', 'idea_items',
    'registry_links'
  ]
  loop
    execute format(
      'create policy "members can read" on public.%I for select to authenticated
         using ((select private.is_member(wedding_id)))', t);
    execute format(
      'create policy "editors can insert" on public.%I for insert to authenticated
         with check ((select private.can_edit(wedding_id)))', t);
    execute format(
      'create policy "editors can update" on public.%I for update to authenticated
         using ((select private.can_edit(wedding_id)))
         with check ((select private.can_edit(wedding_id)))', t);
    execute format(
      'create policy "editors can delete" on public.%I for delete to authenticated
         using ((select private.can_edit(wedding_id)))', t);
  end loop;
end;
$$;

-- weddings (inserted only through create_wedding) ---------------------------

create policy "members can read" on public.weddings for select to authenticated
  using ((select private.is_member(id)));
create policy "editors can update" on public.weddings for update to authenticated
  using ((select private.can_edit(id)))
  with check ((select private.can_edit(id)));
create policy "couple can delete" on public.weddings for delete to authenticated
  using ((select private.is_couple(id)));

-- members (inserted only through create_wedding / accept_invite) ------------

create policy "members can read" on public.members for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "couple can update" on public.members for update to authenticated
  using ((select private.is_couple(wedding_id)))
  with check ((select private.is_couple(wedding_id)));
create policy "couple can remove, anyone can leave" on public.members for delete to authenticated
  using ((select private.is_couple(wedding_id)) or user_id = (select auth.uid()));

-- invites -------------------------------------------------------------------

create policy "editors can read" on public.invites for select to authenticated
  using ((select private.can_edit(wedding_id)));
create policy "editors can create, only couple can invite couple" on public.invites
  for insert to authenticated
  with check (
    (select private.can_edit(wedding_id))
    and (role <> 'couple' or (select private.is_couple(wedding_id)))
  );
create policy "editors can delete" on public.invites for delete to authenticated
  using ((select private.can_edit(wedding_id)));

-- checklist templates (shared, read-only) -----------------------------------

create policy "signed-in users can read" on public.checklist_templates for select
  to authenticated using (true);

-- tasks ---------------------------------------------------------------------

create policy "members can read" on public.tasks for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "editors can insert" on public.tasks for insert to authenticated
  with check ((select private.can_edit(wedding_id)));
create policy "editors and assignee can update" on public.tasks for update to authenticated
  using ((select private.can_edit(wedding_id)) or private.is_assignee(assignee_id))
  with check ((select private.can_edit(wedding_id)) or private.is_assignee(assignee_id));
create policy "editors can delete" on public.tasks for delete to authenticated
  using ((select private.can_edit(wedding_id)));

-- Helpers may only change status and notes on their own tasks; completed_at follows status.
create function private.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  allowed text[] := array['status', 'notes', 'completed_at', 'updated_at'];
begin
  if tg_op = 'UPDATE'
    and (select auth.uid()) is not null
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

create trigger tasks_before_write before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

-- comments and reactions ----------------------------------------------------

create policy "members can read" on public.comments for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "members can comment as themselves" on public.comments for insert to authenticated
  with check ((select private.is_member(wedding_id)) and author_id = (select auth.uid()));
create policy "authors can edit" on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check ((select private.is_member(wedding_id)) and author_id = (select auth.uid()));
create policy "authors and editors can delete" on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or (select private.can_edit(wedding_id)));

create policy "members can read" on public.reactions for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "members can react as themselves" on public.reactions for insert to authenticated
  with check ((select private.is_member(wedding_id)) and user_id = (select auth.uid()));
create policy "users can remove their reactions" on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- emails (inserted by the inbound webhook with the service role) ------------

create policy "members can read" on public.emails for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "editors can update" on public.emails for update to authenticated
  using ((select private.can_edit(wedding_id)))
  with check ((select private.can_edit(wedding_id)));
create policy "editors can delete" on public.emails for delete to authenticated
  using ((select private.can_edit(wedding_id)));

-- activity (written by triggers) --------------------------------------------

create policy "members can read" on public.activity for select to authenticated
  using ((select private.is_member(wedding_id)));
