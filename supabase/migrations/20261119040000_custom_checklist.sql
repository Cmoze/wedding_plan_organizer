-- Spec 003 / Decision 002: new weddings start with no tasks; the couple picks from
-- checklist_templates (now a suggestion list) at setup or later from Tasks.
--
-- 1. create_wedding no longer copies checklist_templates into tasks.
-- 2. add_template_tasks(): adds chosen suggestions with due dates worked out from the
--    wedding date, skipping ones the wedding already has. Couple or planner only.
-- 3. Spec 002 row 5: rename "Rehearsal and rehearsal dinner" so it doesn't read like
--    "Plan the rehearsal dinner", in the template and in tasks that kept the old title.

-- create_wedding (same signature as 20261119030000, minus the task copy) ---------------

create or replace function public.create_wedding(
  _partner1_name text,
  _partner2_name text default null,
  _wedding_date date default null,
  _budget_total numeric default null,
  _guest_count_estimate integer default null,
  _display_name text default null,
  _role public.member_role default 'couple'
)
returns public.weddings
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := (select auth.uid());
  _base text;
  _slug text;
  _n integer := 1;
  _wedding public.weddings;
begin
  if _uid is null then
    raise exception 'You must be signed in to create a wedding' using errcode = '42501';
  end if;
  if _role is null or _role not in ('couple', 'planner') then
    raise exception 'A new wedding''s creator must be the couple or a planner'
      using errcode = '22023';
  end if;

  _base := trim(both '-' from regexp_replace(
    lower(concat_ws('-', _partner1_name, _partner2_name)), '[^a-z0-9]+', '-', 'g'));
  if _base = '' then
    _base := 'wedding';
  end if;
  _slug := _base;
  while exists (select 1 from public.weddings w where w.email_slug = _slug) loop
    _n := _n + 1;
    _slug := _base || '-' || _n;
  end loop;

  insert into public.weddings (
    partner1_name, partner2_name, wedding_date, budget_total, guest_count_estimate,
    email_slug, created_by
  )
  values (
    trim(_partner1_name), nullif(trim(_partner2_name), ''), _wedding_date, _budget_total,
    _guest_count_estimate, _slug, _uid
  )
  returning * into _wedding;

  insert into public.members (wedding_id, user_id, role, display_name)
  values (_wedding.id, _uid, _role, coalesce(nullif(trim(_display_name), ''), _wedding.partner1_name));

  return _wedding;
end;
$$;

-- add_template_tasks --------------------------------------------------------------------

create function public.add_template_tasks(_wedding_id uuid, _template_ids uuid[])
returns setof public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  _wedding_date date;
begin
  if not (select private.can_edit(_wedding_id)) then
    raise exception 'Only the couple or a planner can add to the checklist'
      using errcode = '42501';
  end if;

  select w.wedding_date into _wedding_date from public.weddings w where w.id = _wedding_id;

  return query
  insert into public.tasks (
    wedding_id, title, category, notes, months_before, due_date, template_id, sort_order
  )
  select
    _wedding_id, t.title, t.category, t.notes, t.months_before,
    case when _wedding_date is not null then
      greatest(_wedding_date - round(t.months_before * 30.44)::integer, current_date)
    end,
    t.id, t.sort_order
  from public.checklist_templates t
  where t.id = any (_template_ids)
    and not exists (
      select 1 from public.tasks x where x.wedding_id = _wedding_id and x.template_id = t.id
    )
  order by t.sort_order
  returning *;
end;
$$;

revoke execute on function public.add_template_tasks(uuid, uuid[]) from public, anon;
grant execute on function public.add_template_tasks(uuid, uuid[]) to authenticated;

-- rename the day-before rehearsal task (spec 002 row 5) -----------------------------------

update public.checklist_templates
set title = 'Attend the rehearsal and rehearsal dinner'
where title = 'Rehearsal and rehearsal dinner';

update public.tasks
set title = 'Attend the rehearsal and rehearsal dinner'
where title = 'Rehearsal and rehearsal dinner'
  and template_id is not null;
