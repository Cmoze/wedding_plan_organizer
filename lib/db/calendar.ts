import type { BudgetItem } from "@/lib/db/budget";
import type { WeddingEvent } from "@/lib/db/events";
import { unwrap, type Db } from "@/lib/db/shared";
import type { Task } from "@/lib/db/tasks";

export type CalendarItem = {
  kind: "task" | "event" | "payment";
  /** Id of the task, event or budget item, for opening it. */
  id: string;
  title: string;
  /** `YYYY-MM-DD` for tasks and payments; ISO timestamp for events. */
  start: string;
  end: string | null;
  allDay: boolean;
  done: boolean;
  /** Events only. */
  location: string | null;
  /** Payments only: what's still owed. */
  amountDue: number | null;
};

/**
 * Everything with a date, sorted: tasks with a due date, events, and budget payment due dates.
 * `from` / `to` are inclusive `YYYY-MM-DD` dates.
 */
export async function getCalendarItems(
  db: Db,
  weddingId: string,
  range: { from?: string; to?: string } = {},
): Promise<CalendarItem[]> {
  let tasks = db
    .from("tasks")
    .select("*")
    .eq("wedding_id", weddingId)
    .not("due_date", "is", null);
  let events = db.from("events").select("*").eq("wedding_id", weddingId);
  let payments = db
    .from("budget_items")
    .select("*")
    .eq("wedding_id", weddingId)
    .not("due_date", "is", null);
  if (range.from) {
    tasks = tasks.gte("due_date", range.from);
    events = events.gte("starts_at", range.from);
    payments = payments.gte("due_date", range.from);
  }
  if (range.to) {
    tasks = tasks.lte("due_date", range.to);
    events = events.lte("starts_at", `${range.to}T23:59:59.999Z`);
    payments = payments.lte("due_date", range.to);
  }
  const [t, e, p] = await Promise.all([tasks, events, payments]);
  return mergeCalendarItems(unwrap(t), unwrap(e), unwrap(p));
}

export function mergeCalendarItems(
  tasks: Pick<Task, "id" | "title" | "due_date" | "status">[],
  events: (Pick<
    WeddingEvent,
    "id" | "title" | "starts_at" | "ends_at" | "all_day"
  > &
    Partial<Pick<WeddingEvent, "location">>)[],
  payments: Pick<
    BudgetItem,
    | "id"
    | "category"
    | "description"
    | "due_date"
    | "estimated"
    | "actual"
    | "paid"
  >[],
): CalendarItem[] {
  const items: CalendarItem[] = [
    ...tasks
      .filter((t) => t.due_date)
      .map((t) => ({
        kind: "task" as const,
        id: t.id,
        title: t.title,
        start: t.due_date!,
        end: null,
        allDay: true,
        done: t.status === "done" || t.status === "booked",
        location: null,
        amountDue: null,
      })),
    ...events.map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      start: e.starts_at,
      end: e.ends_at,
      allDay: e.all_day,
      done: false,
      location: e.location ?? null,
      amountDue: null,
    })),
    ...payments
      .filter((p) => p.due_date)
      .map((p) => ({
        kind: "payment" as const,
        id: p.id,
        title: `Payment due: ${p.description || p.category}`,
        start: p.due_date!,
        end: null,
        allDay: true,
        done:
          Number(p.paid) >= Number(p.actual ?? p.estimated) &&
          Number(p.paid) > 0,
        location: null,
        amountDue: Math.max(
          0,
          Number(p.actual ?? p.estimated) - Number(p.paid),
        ),
      })),
  ];
  return items.sort(
    (a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title),
  );
}
