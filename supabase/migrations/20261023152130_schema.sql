-- Core schema for the wedding workspace. See docs/DATA_MODEL.md.
-- Child tables carry wedding_id (for RLS and indexes) and use composite foreign keys
-- (child_id, wedding_id) so a row can never point at another wedding's data.

create schema if not exists private;

create type public.member_role as enum ('couple', 'planner', 'helper');
create type public.task_status as enum ('todo', 'in_progress', 'done', 'booked');
create type public.vendor_status as enum ('considering', 'contacted', 'booked', 'declined');
create type public.guest_side as enum ('partner1', 'partner2', 'both');
create type public.rsvp_status as enum ('pending', 'attending', 'declined');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- weddings ------------------------------------------------------------------

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  partner1_name text not null check (length(trim(partner1_name)) > 0),
  partner2_name text,
  wedding_date date,
  budget_total numeric(12, 2) check (budget_total >= 0),
  guest_count_estimate integer check (guest_count_estimate >= 0),
  email_slug text not null unique check (email_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index weddings_created_by_idx on public.weddings (created_by);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, user_id),
  unique (id, wedding_id)
);
create index members_user_id_idx on public.members (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role public.member_role not null default 'helper',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invites_wedding_id_idx on public.invites (wedding_id);
create index invites_created_by_idx on public.invites (created_by);

-- planning ------------------------------------------------------------------

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  months_before numeric(4, 2) not null check (months_before >= 0),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  type text,
  contact_name text,
  phone text,
  email text,
  website text,
  status public.vendor_status not null default 'considering',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index vendors_wedding_id_idx on public.vendors (wedding_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  notes text,
  category text,
  due_date date,
  months_before numeric(4, 2),
  status public.task_status not null default 'todo',
  assignee_id uuid,
  vendor_id uuid,
  template_id uuid references public.checklist_templates (id) on delete set null,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (assignee_id, wedding_id) references public.members (id, wedding_id)
    on delete set null (assignee_id),
  foreign key (vendor_id, wedding_id) references public.vendors (id, wedding_id)
    on delete set null (vendor_id)
);
create index tasks_wedding_id_due_date_idx on public.tasks (wedding_id, due_date);
create index tasks_assignee_id_idx on public.tasks (assignee_id, wedding_id);
create index tasks_vendor_id_idx on public.tasks (vendor_id, wedding_id);
create index tasks_template_id_idx on public.tasks (template_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_wedding_id_starts_at_idx on public.events (wedding_id, starts_at);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null,
  description text not null default '',
  estimated numeric(12, 2) not null default 0 check (estimated >= 0),
  actual numeric(12, 2) check (actual >= 0),
  paid numeric(12, 2) not null default 0 check (paid >= 0),
  due_date date,
  vendor_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (vendor_id, wedding_id) references public.vendors (id, wedding_id)
    on delete set null (vendor_id)
);
create index budget_items_wedding_id_idx on public.budget_items (wedding_id);
create index budget_items_vendor_id_idx on public.budget_items (vendor_id, wedding_id);

-- guests --------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  side public.guest_side not null default 'both',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index households_wedding_id_idx on public.households (wedding_id);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  household_id uuid not null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  rsvp public.rsvp_status not null default 'pending',
  meal_choice text,
  plus_one_allowed boolean not null default false,
  is_child boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (household_id, wedding_id) references public.households (id, wedding_id)
    on delete cascade
);
create index guests_wedding_id_idx on public.guests (wedding_id);
create index guests_household_id_idx on public.guests (household_id, wedding_id);

-- ideas ---------------------------------------------------------------------

create table public.idea_boards (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  category text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id)
);
create index idea_boards_wedding_id_idx on public.idea_boards (wedding_id);
create index idea_boards_created_by_idx on public.idea_boards (created_by);

create table public.idea_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  board_id uuid not null,
  photo_path text,
  caption text,
  link_url text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (board_id, wedding_id) references public.idea_boards (id, wedding_id)
    on delete cascade,
  check (photo_path is not null or link_url is not null or caption is not null)
);
create index idea_items_wedding_id_idx on public.idea_items (wedding_id);
create index idea_items_board_id_idx on public.idea_items (board_id, wedding_id);
create index idea_items_created_by_idx on public.idea_items (created_by);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  body text not null check (length(trim(body)) > 0),
  task_id uuid,
  idea_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(task_id, idea_item_id) = 1),
  foreign key (task_id, wedding_id) references public.tasks (id, wedding_id) on delete cascade,
  foreign key (idea_item_id, wedding_id) references public.idea_items (id, wedding_id)
    on delete cascade
);
create index comments_wedding_id_idx on public.comments (wedding_id);
create index comments_task_id_idx on public.comments (task_id, wedding_id);
create index comments_idea_item_id_idx on public.comments (idea_item_id, wedding_id);
create index comments_author_id_idx on public.comments (author_id);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  idea_item_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  emoji text not null default '👍',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_item_id, user_id, emoji),
  foreign key (idea_item_id, wedding_id) references public.idea_items (id, wedding_id)
    on delete cascade
);
create index reactions_wedding_id_idx on public.reactions (wedding_id);
create index reactions_idea_item_id_idx on public.reactions (idea_item_id, wedding_id);
create index reactions_user_id_idx on public.reactions (user_id);

-- inbox, activity, registry -------------------------------------------------

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  provider_message_id text unique,
  from_address text not null,
  from_name text,
  to_address text not null,
  subject text not null default '',
  body_text text,
  body_html text,
  attachments jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  is_read boolean not null default false,
  linked_task_id uuid,
  linked_vendor_id uuid,
  linked_budget_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (linked_task_id, wedding_id) references public.tasks (id, wedding_id)
    on delete set null (linked_task_id),
  foreign key (linked_vendor_id, wedding_id) references public.vendors (id, wedding_id)
    on delete set null (linked_vendor_id),
  foreign key (linked_budget_item_id, wedding_id) references public.budget_items (id, wedding_id)
    on delete set null (linked_budget_item_id)
);
create index emails_wedding_id_received_at_idx on public.emails (wedding_id, received_at desc);
create index emails_linked_task_id_idx on public.emails (linked_task_id, wedding_id);
create index emails_linked_vendor_id_idx on public.emails (linked_vendor_id, wedding_id);
create index emails_linked_budget_item_id_idx on public.emails (linked_budget_item_id, wedding_id);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('created', 'updated', 'completed', 'deleted')),
  entity_type text not null,
  entity_id uuid,
  summary text not null default '',
  created_at timestamptz not null default now()
);
create index activity_wedding_id_created_at_idx on public.activity (wedding_id, created_at desc);
create index activity_actor_id_idx on public.activity (actor_id);

create table public.registry_links (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  store_name text not null,
  url text not null check (url ~* '^https?://'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index registry_links_wedding_id_idx on public.registry_links (wedding_id);

-- updated_at triggers -------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'weddings', 'members', 'invites', 'vendors', 'tasks', 'events', 'budget_items',
    'households', 'guests', 'idea_boards', 'idea_items', 'comments', 'reactions',
    'emails', 'registry_links'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()',
      t
    );
  end loop;
end;
$$;
