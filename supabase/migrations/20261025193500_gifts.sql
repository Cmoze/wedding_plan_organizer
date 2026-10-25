-- Gifts the couple received, and whether the thank-you card has gone out (Registry section).

alter table public.registry_links add unique (id, wedding_id);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  household_id uuid,
  giver_name text not null,
  description text not null,
  registry_link_id uuid,
  received_on date,
  thank_you_sent_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (household_id, wedding_id) references public.households (id, wedding_id)
    on delete set null (household_id),
  foreign key (registry_link_id, wedding_id) references public.registry_links (id, wedding_id)
    on delete set null (registry_link_id)
);
create index gifts_wedding_id_idx on public.gifts (wedding_id);
create index gifts_household_id_idx on public.gifts (household_id, wedding_id);
create index gifts_registry_link_id_idx on public.gifts (registry_link_id, wedding_id);

create trigger set_updated_at before update on public.gifts
  for each row execute function private.set_updated_at();
create trigger log_activity after insert or update or delete on public.gifts
  for each row execute function private.log_activity();

alter table public.gifts enable row level security;

create policy "members can read" on public.gifts for select to authenticated
  using ((select private.is_member(wedding_id)));
create policy "editors can insert" on public.gifts for insert to authenticated
  with check ((select private.can_edit(wedding_id)));
create policy "editors can update" on public.gifts for update to authenticated
  using ((select private.can_edit(wedding_id)))
  with check ((select private.can_edit(wedding_id)));
create policy "editors can delete" on public.gifts for delete to authenticated
  using ((select private.can_edit(wedding_id)));
