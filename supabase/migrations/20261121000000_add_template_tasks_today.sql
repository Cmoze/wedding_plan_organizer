-- add_template_tasks takes "today" from the app (spec 002, "Noticed while checking").
--
-- Suggestions whose date has passed get today as their due date. current_date is the
-- database's date (UTC), which in the evening in the Americas is already tomorrow, so those
-- tasks came out a day late. The app now passes the viewer's own date (lib/time-zone.ts).
-- With no _today, it falls back to current_date, as before.

drop function if exists public.add_template_tasks(uuid, uuid[]);

create function public.add_template_tasks(
  _wedding_id uuid,
  _template_ids uuid[],
  _today date default null
)
returns setof public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  _wedding_date date;
  -- Only trust a date within a day of the database's, so a caller can't backdate tasks.
  _floor date := case
    when _today between current_date - 1 and current_date + 1 then _today
    else current_date
  end;
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
      greatest(_wedding_date - round(t.months_before * 30.44)::integer, _floor)
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

revoke execute on function public.add_template_tasks(uuid, uuid[], date) from public, anon;
grant execute on function public.add_template_tasks(uuid, uuid[], date) to authenticated;
