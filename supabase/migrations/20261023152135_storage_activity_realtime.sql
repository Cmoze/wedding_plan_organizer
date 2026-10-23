-- Storage buckets, the activity feed triggers, and realtime.

-- storage -------------------------------------------------------------------
-- Object paths start with the wedding id: <wedding_id>/<file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('idea-photos', 'idea-photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']),
  ('email-attachments', 'email-attachments', false, 26214400, null);

create function private.path_wedding_id(_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(_name, '/', 1)::uuid
  end;
$$;

revoke all on function private.path_wedding_id(text) from public, anon;
grant execute on function private.path_wedding_id(text) to authenticated;

create policy "idea photos: members can read" on storage.objects for select to authenticated
  using (bucket_id = 'idea-photos' and (select private.is_member(private.path_wedding_id(name))));
create policy "idea photos: editors can upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'idea-photos' and (select private.can_edit(private.path_wedding_id(name))));
create policy "idea photos: editors can replace" on storage.objects for update to authenticated
  using (bucket_id = 'idea-photos' and (select private.can_edit(private.path_wedding_id(name))))
  with check (bucket_id = 'idea-photos' and (select private.can_edit(private.path_wedding_id(name))));
create policy "idea photos: editors can delete" on storage.objects for delete to authenticated
  using (bucket_id = 'idea-photos' and (select private.can_edit(private.path_wedding_id(name))));

create policy "email attachments: members can read" on storage.objects for select to authenticated
  using (bucket_id = 'email-attachments' and (select private.is_member(private.path_wedding_id(name))));

-- activity feed -------------------------------------------------------------

create function private.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _row jsonb;
  _old jsonb;
  _action text;
  _wedding_id uuid;
begin
  if tg_op = 'DELETE' then
    _row := to_jsonb(old);
  else
    _row := to_jsonb(new);
  end if;
  _wedding_id := (_row ->> 'wedding_id')::uuid;

  -- Checklist tasks copied in by create_wedding would flood the feed.
  if tg_op = 'INSERT' and tg_table_name = 'tasks' and _row ->> 'template_id' is not null then
    return null;
  end if;
  -- Cascading deletes of a whole wedding: nothing left to log against.
  if not exists (select 1 from public.weddings w where w.id = _wedding_id) then
    return null;
  end if;

  if tg_op = 'INSERT' then
    _action := 'created';
  elsif tg_op = 'DELETE' then
    _action := 'deleted';
  else
    _old := to_jsonb(old);
    if (_old - 'updated_at') = (_row - 'updated_at') then
      return null;
    end if;
    if tg_table_name = 'tasks'
      and _row ->> 'status' in ('done', 'booked')
      and _old ->> 'status' not in ('done', 'booked')
    then
      _action := 'completed';
    else
      _action := 'updated';
    end if;
  end if;

  insert into public.activity (wedding_id, actor_id, action, entity_type, entity_id, summary)
  values (
    _wedding_id,
    (select auth.uid()),
    _action,
    tg_table_name,
    (_row ->> 'id')::uuid,
    left(coalesce(
      _row ->> 'title',
      _row ->> 'name',
      _row ->> 'store_name',
      _row ->> 'display_name',
      nullif(_row ->> 'description', ''),
      _row ->> 'caption',
      _row ->> 'body',
      ''
    ), 200)
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'members', 'tasks', 'events', 'vendors', 'budget_items', 'households', 'idea_boards',
    'idea_items', 'comments', 'registry_links'
  ]
  loop
    execute format(
      'create trigger log_activity after insert or update or delete on public.%I
         for each row execute function private.log_activity()',
      t
    );
  end loop;
end;
$$;

-- realtime ------------------------------------------------------------------
-- postgres_changes respects RLS, so subscribers only receive rows they can read.

alter publication supabase_realtime add table public.tasks, public.comments, public.activity;
