-- A finished task can record its cost: that expense shows up in the budget and stays linked to the task.

alter table public.budget_items
  add column task_id uuid,
  add foreign key (task_id, wedding_id) references public.tasks (id, wedding_id)
    on delete set null (task_id);

-- At most one expense per task, so saving a task's details again updates it instead of adding another.
create unique index budget_items_task_id_key on public.budget_items (task_id);
