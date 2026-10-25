import {
  DbError,
  unwrap,
  type Db,
  type Enums,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type Task = Tables<"tasks">;
export type TaskStatus = Enums<"task_status">;

export const PLANNED_STATUSES: TaskStatus[] = ["done", "booked"];
export const OPEN_STATUSES: TaskStatus[] = ["todo", "in_progress"];

export type TaskFilters = {
  status?: TaskStatus[];
  /** A member id (members.id), or null for unassigned tasks. */
  assigneeId?: string | null;
  /** Inclusive `YYYY-MM-DD` bounds on due_date. */
  dueFrom?: string;
  dueTo?: string;
  category?: string;
};

export async function getTasks(
  db: Db,
  weddingId: string,
  filters: TaskFilters = {},
): Promise<Task[]> {
  let query = db.from("tasks").select("*").eq("wedding_id", weddingId);
  if (filters.status?.length) query = query.in("status", filters.status);
  if (filters.assigneeId === null) query = query.is("assignee_id", null);
  else if (filters.assigneeId)
    query = query.eq("assignee_id", filters.assigneeId);
  if (filters.dueFrom) query = query.gte("due_date", filters.dueFrom);
  if (filters.dueTo) query = query.lte("due_date", filters.dueTo);
  if (filters.category) query = query.eq("category", filters.category);
  return unwrap(
    await query
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("sort_order")
      .order("created_at"),
  );
}

/** "What's already planned": tasks marked done or booked. */
export function getAlreadyPlanned(db: Db, weddingId: string): Promise<Task[]> {
  return getTasks(db, weddingId, { status: PLANNED_STATUSES });
}

/** Open tasks with a due date before `today` (`YYYY-MM-DD`). */
export async function getOverdueTasks(
  db: Db,
  weddingId: string,
  today: string,
): Promise<Task[]> {
  return unwrap(
    await db
      .from("tasks")
      .select("*")
      .eq("wedding_id", weddingId)
      .in("status", OPEN_STATUSES)
      .lt("due_date", today)
      .order("due_date"),
  );
}

export async function getTask(db: Db, taskId: string): Promise<Task> {
  return unwrap(await db.from("tasks").select("*").eq("id", taskId).single());
}

/** New tasks go to the end of the plan unless `sort_order` says otherwise. */
export async function createTask(
  db: Db,
  weddingId: string,
  input: NewRow<"tasks">,
): Promise<Task> {
  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const last = unwrap(
      await db
        .from("tasks")
        .select("sort_order")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: false })
        .limit(1),
    );
    sortOrder = (last[0]?.sort_order ?? 0) + 1;
  }
  return unwrap(
    await db
      .from("tasks")
      .insert({ ...input, wedding_id: weddingId, sort_order: sortOrder })
      .select()
      .single(),
  );
}

/** Couple/planner can change anything; a helper only `status` and `notes` on their own tasks. */
export async function updateTask(
  db: Db,
  taskId: string,
  patch: RowPatch<"tasks">,
): Promise<Task> {
  const rows = unwrap(
    await db.from("tasks").update(patch).eq("id", taskId).select(),
  );
  if (rows.length === 0) throw new DbError("You can't edit this task", "42501");
  return rows[0];
}

export function updateTaskStatus(
  db: Db,
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  return updateTask(db, taskId, { status });
}

export async function deleteTask(db: Db, taskId: string): Promise<void> {
  unwrap(await db.from("tasks").delete().eq("id", taskId));
}

/**
 * The order to do things in: the checklist's sequence (budget and guest list first, thank-you notes last),
 * with tasks people add themselves after it in the order they were added.
 */
export function sortTasksInPlanOrder<
  T extends Pick<Task, "sort_order" | "created_at">,
>(tasks: T[]): T[] {
  return [...tasks].sort(
    (a, b) =>
      a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );
}

/** Soonest due date first. Tasks with no date come last, in checklist order. */
export function sortTasksByDueDate<
  T extends Pick<Task, "due_date" | "sort_order" | "created_at">,
>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.due_date === b.due_date)
      return (
        a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
      );
    if (a.due_date === null) return 1;
    if (b.due_date === null) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

const BUDGET_CATEGORIES: [RegExp, string][] = [
  [/venue/i, "Venue"],
  [/photograph|videograph/i, "Photography"],
  [/cater|cake|menu/i, "Catering"],
  [/band|dj\b|music/i, "Music"],
  [/flor|flower/i, "Flowers"],
  [/invitation|save-the-date|stationery/i, "Stationery"],
  [/hair|makeup/i, "Hair & makeup"],
  [/dress|suit|attire|ring/i, "Attire"],
  [/transport/i, "Transportation"],
  [/officiant/i, "Officiant"],
  [/honeymoon/i, "Honeymoon"],
];

/** The budget category a task's cost goes under, e.g. "Book the photographer" → "Photography". */
export function budgetCategoryFor(task: Pick<Task, "title" | "category">) {
  return (
    BUDGET_CATEGORIES.find(([pattern]) => pattern.test(task.title))?.[1] ??
    task.category ??
    "Other"
  );
}

/** "Set the overall budget": its amount is the wedding's total budget, not an expense. */
export const setsTheBudget = (task: Pick<Task, "title">) =>
  /\bset\b.*\bbudget\b/i.test(task.title);

export type TaskDetails = {
  /** What was chosen: the venue, the photographer, the store. Saved as a booked vendor. */
  name?: string;
  link?: string;
  /** Saved as the task's expense in the budget, or as the total budget for "Set the overall budget". */
  cost?: number;
  /** Replaces the task's notes; leave out to keep them, null to clear them. */
  notes?: string | null;
};

/**
 * Marks a task done and records what was chosen. The name and link go on a vendor linked to the task,
 * the cost on the task's budget expense (added once, then updated). Couple and planner only.
 */
export async function finishTaskWithDetails(
  db: Db,
  taskId: string,
  details: TaskDetails,
): Promise<Task> {
  const task = await getTask(db, taskId);
  if (setsTheBudget(task)) {
    if (details.cost !== undefined) {
      unwrap(
        await db
          .from("weddings")
          .update({ budget_total: details.cost })
          .eq("id", task.wedding_id),
      );
    }
    unwrap(await db.from("budget_items").delete().eq("task_id", task.id));
    return updateTask(db, task.id, {
      status: PLANNED_STATUSES.includes(task.status) ? task.status : "done",
      notes: details.notes === undefined ? task.notes : details.notes,
    });
  }
  const category = budgetCategoryFor(task);

  let vendorId = task.vendor_id;
  if (details.name || details.link) {
    const website = details.link ?? null;
    if (vendorId) {
      unwrap(
        await db
          .from("vendors")
          .update(details.name ? { name: details.name, website } : { website })
          .eq("id", vendorId),
      );
    } else {
      vendorId = unwrap<{ id: string }>(
        await db
          .from("vendors")
          .insert({
            name: details.name ?? task.title,
            website,
            wedding_id: task.wedding_id,
            type: category,
            status: "booked",
          })
          .select("id")
          .single(),
      ).id;
    }
  }

  if (details.cost !== undefined) {
    const description = details.name ?? task.title;
    const existing = unwrap<{ id: string } | null>(
      await db
        .from("budget_items")
        .select("id")
        .eq("task_id", task.id)
        .maybeSingle(),
    );
    if (existing) {
      unwrap(
        await db
          .from("budget_items")
          .update({ actual: details.cost, description, vendor_id: vendorId })
          .eq("id", existing.id),
      );
    } else {
      unwrap(
        await db.from("budget_items").insert({
          wedding_id: task.wedding_id,
          task_id: task.id,
          vendor_id: vendorId,
          category,
          description,
          estimated: details.cost,
          actual: details.cost,
        }),
      );
    }
  }

  return updateTask(db, task.id, {
    status: PLANNED_STATUSES.includes(task.status) ? task.status : "done",
    vendor_id: vendorId,
    notes: details.notes === undefined ? task.notes : details.notes,
  });
}
