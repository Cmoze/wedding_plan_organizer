-- Checklist template, create_wedding() and the invite flow.
-- These functions are security definer because they insert into weddings/members, which have
-- no insert policies. Each one checks the caller itself.

insert into public.checklist_templates (sort_order, months_before, category, title) values
  (1, 12, 'Planning', 'Set the overall budget'),
  (2, 12, 'Planning', 'Draft the guest list'),
  (3, 12, 'Planning', 'Pick a wedding date'),
  (4, 12, 'Planning', 'Decide on the wedding party'),
  (5, 12, 'Venue', 'Tour and book the ceremony venue'),
  (6, 12, 'Venue', 'Tour and book the reception venue'),
  (7, 11, 'Vendors', 'Book the officiant'),
  (8, 10, 'Vendors', 'Book the photographer'),
  (9, 10, 'Vendors', 'Book the videographer'),
  (10, 10, 'Vendors', 'Book the caterer'),
  (11, 9, 'Vendors', 'Book the band or DJ'),
  (12, 9, 'Attire', 'Shop for the wedding dress or suit'),
  (13, 9, 'Guests', 'Reserve hotel room blocks for guests'),
  (14, 9, 'Stationery', 'Send save-the-dates'),
  (15, 8, 'Vendors', 'Book the florist'),
  (16, 8, 'Planning', 'Create the gift registry'),
  (17, 7, 'Vendors', 'Order the wedding cake'),
  (18, 6, 'Attire', 'Choose wedding party attire'),
  (19, 6, 'Vendors', 'Book transportation'),
  (20, 6, 'Vendors', 'Book hair and makeup'),
  (21, 6, 'Planning', 'Plan the honeymoon'),
  (22, 5, 'Planning', 'Plan the rehearsal dinner'),
  (23, 4, 'Stationery', 'Order invitations'),
  (24, 4, 'Attire', 'Buy wedding rings'),
  (25, 4, 'Planning', 'Choose readings and music for the ceremony'),
  (26, 3, 'Attire', 'Schedule dress or suit fittings'),
  (27, 3, 'Planning', 'Finalize the menu with the caterer'),
  (28, 2, 'Stationery', 'Mail invitations'),
  (29, 2, 'Legal', 'Get the marriage license'),
  (30, 2, 'Planning', 'Buy gifts for the wedding party'),
  (31, 1.5, 'Planning', 'Write vows'),
  (32, 1, 'Guests', 'Follow up on missing RSVPs'),
  (33, 1, 'Guests', 'Make the seating chart'),
  (34, 1, 'Vendors', 'Confirm timelines with every vendor'),
  (35, 1, 'Planning', 'Write the day-of schedule'),
  (36, 1, 'Guests', 'Give the final guest count to the caterer'),
  (37, 0.5, 'Budget', 'Prepare final vendor payments and tips'),
  (38, 0.5, 'Attire', 'Final dress or suit fitting'),
  (39, 0.25, 'Planning', 'Pack for the honeymoon'),
  (40, 0.1, 'Planning', 'Rehearsal and rehearsal dinner'),
  (41, 0, 'Planning', 'Return rentals and send thank-you notes');

-- create_wedding ------------------------------------------------------------

create function public.create_wedding(
  _partner1_name text,
  _partner2_name text default null,
  _wedding_date date default null,
  _budget_total numeric default null,
  _guest_count_estimate integer default null,
  _display_name text default null
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
  values (_wedding.id, _uid, 'couple', coalesce(nullif(trim(_display_name), ''), _wedding.partner1_name));

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

-- invites -------------------------------------------------------------------

-- Lets the invite page show who is inviting you before you sign in.
create function public.get_invite(_token uuid)
returns table (
  wedding_id uuid,
  partner1_name text,
  partner2_name text,
  wedding_date date,
  role public.member_role,
  expired boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.partner1_name, w.partner2_name, w.wedding_date, i.role, i.expires_at < now()
  from public.invites i
  join public.weddings w on w.id = i.wedding_id
  where i.token = _token;
$$;

create function public.accept_invite(_token uuid, _display_name text default null)
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

  select * into _invite from public.invites where token = _token;
  if not found then
    raise exception 'This invite link is not valid' using errcode = 'P0002';
  end if;
  if _invite.expires_at < now() then
    raise exception 'This invite link has expired' using errcode = '22023';
  end if;

  select email into _email from auth.users where id = _uid;

  insert into public.members (wedding_id, user_id, role, display_name)
  values (
    _invite.wedding_id, _uid, _invite.role,
    coalesce(nullif(trim(_display_name), ''), split_part(_email, '@', 1), '')
  )
  on conflict (wedding_id, user_id) do nothing;

  return _invite.wedding_id;
end;
$$;

revoke execute on function
  public.create_wedding(text, text, date, numeric, integer, text),
  public.accept_invite(uuid, text),
  public.get_invite(uuid)
from public, anon;
grant execute on function
  public.create_wedding(text, text, date, numeric, integer, text),
  public.accept_invite(uuid, text)
to authenticated;
grant execute on function public.get_invite(uuid) to anon, authenticated;
