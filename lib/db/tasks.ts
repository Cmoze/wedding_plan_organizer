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

export async function createTask(
  db: Db,
  weddingId: string,
  input: NewRow<"tasks">,
): Promise<Task> {
  return unwrap(
    await db
      .from("tasks")
      .insert({ ...input, wedding_id: weddingId })
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

export const TIMEFRAMES = [
  { label: "12+ months out", minMonths: 12 },
  { label: "9 to 12 months out", minMonths: 9 },
  { label: "6 to 9 months out", minMonths: 6 },
  { label: "3 to 6 months out", minMonths: 3 },
  { label: "1 to 3 months out", minMonths: 1 },
  { label: "Final month", minMonths: 0.25 },
  { label: "Final week", minMonths: 0 },
] as const;

const DAYS_PER_MONTH = 30.44;

function monthsBefore(task: Task, weddingDate: string | null): number | null {
  if (task.months_before !== null) return Number(task.months_before);
  if (!task.due_date || !weddingDate) return null;
  const days =
    (Date.parse(weddingDate) - Date.parse(task.due_date)) / 86_400_000;
  return Math.max(0, days / DAYS_PER_MONTH);
}

/**
 * Groups tasks for the Tasks screen ("12+ months out", "6 to 9 months out", ...).
 * Uses the checklist offset when there is one, otherwise due date vs. wedding date.
 * Empty groups are left out; tasks with no date go last under "No date".
 */
export function groupTasksByTimeframe(
  tasks: Task[],
  weddingDate: string | null,
): { label: string; tasks: Task[] }[] {
  const groups = new Map<string, Task[]>();
  const order: string[] = [...TIMEFRAMES.map((t) => t.label), "No date"];
  for (const task of tasks) {
    const months = monthsBefore(task, weddingDate);
    const label =
      months === null
        ? "No date"
        : (TIMEFRAMES.find((t) => months >= t.minMonths)?.label ??
          "Final week");
    groups.set(label, [...(groups.get(label) ?? []), task]);
  }
  return order
    .filter((l) => groups.has(l))
    .map((label) => ({ label, tasks: groups.get(label)! }));
}
