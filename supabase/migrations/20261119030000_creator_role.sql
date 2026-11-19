-- Spec 002 row 6b: someone who isn't a partner can create a wedding as a planner.
--
-- 1. create_wedding takes _role ('couple' or 'planner', default 'couple').
-- 2. private.has_couple(): does the wedding have any couple member yet?
-- 3. An editor may invite as couple if they're couple OR the wedding has no couple yet,
--    so a planner-created wedding can bring the couple in. Once a couple member exists,
--    inviting as couple is couple-only again.

-- create_wedding ------------------------------------------------------------

-- New signature: drop the old 6-argument version so it doesn't linger as an overload.
drop function public.create_wedding(text, text, date, numeric, integer, text);

create function public.create_wedding(
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

  insert into public.tasks (
    wedding_id, title, category, notes, months_before, due_date, template_id, sort_order
  )
  select
    _wedding.id, t.title, t.category, t.notes, t.months_before,
    case when _wedding.wedding_date is not null then
      greatest(_wedding.wedding_date - round(t.months_before * 30.44)::integer, current_date)
    end,
    t.id, t.sort_order
  from public.checklist_templates t;

  return _wedding;
end;
$$;

revoke execute on function
  public.create_wedding(text, text, date, numeric, integer, text, public.member_role)
from public, anon;
grant execute on function
  public.create_wedding(text, text, date, numeric, integer, text, public.member_role)
to authenticated;

-- has_couple ----------------------------------------------------------------

create function private.has_couple(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.wedding_id = _wedding_id and m.role = 'couple'
  );
$$;

revoke all on function private.has_couple(uuid) from public, anon;
grant execute on function private.has_couple(uuid) to authenticated, service_role;

-- invites -------------------------------------------------------------------

drop policy "editors can create, only couple can invite couple" on public.invites;
create policy "editors can create; couple invites need the couple, or no couple yet"
  on public.invites
  for insert to authenticated
  with check (
    (select private.can_edit(wedding_id))
    and (
      role <> 'couple'
      or (select private.is_couple(wedding_id))
      or not (select private.has_couple(wedding_id))
    )
  );
