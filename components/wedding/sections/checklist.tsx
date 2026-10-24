import { Check, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  addTaskAction,
  deleteTaskAction,
  setTaskStatusAction,
} from "@/app/actions";
import { TaskDetailsForm } from "@/components/wedding/client-forms";
import { memberName, type WeddingContext } from "@/components/wedding/context";
import { formatDate, formatMoney } from "@/components/wedding/format";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  Field,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/wedding/ui";
import { getBudgetItems, type BudgetItem } from "@/lib/db/budget";
import {
  OPEN_STATUSES,
  PLANNED_STATUSES,
  getTasks,
  hasChosenDueDate,
  sortTasksInPlanOrder,
  type Task,
} from "@/lib/db/tasks";
import { getVendors, type Vendor } from "@/lib/db/vendors";

const FILTERS = [
  { id: "open", label: "To do" },
  { id: "planned", label: "Done & booked" },
  { id: "all", label: "Everything" },
] as const;

const STATUS_LABEL: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  booked: "Booked",
};

export async function ChecklistSection({
  ctx,
  show,
}: {
  ctx: WeddingContext;
  show?: string;
}) {
  const [tasks, vendorList, budgetItems] = await Promise.all([
    getTasks(ctx.db, ctx.wedding.id),
    getVendors(ctx.db, ctx.wedding.id),
    getBudgetItems(ctx.db, ctx.wedding.id),
  ]);
  const filter = FILTERS.find((f) => f.id === show)?.id ?? "open";
  const visible = tasks.filter((t) =>
    filter === "all"
      ? true
      : filter === "open"
        ? OPEN_STATUSES.includes(t.status)
        : PLANNED_STATUSES.includes(t.status),
  );
  const finished = tasks.filter((t) =>
    PLANNED_STATUSES.includes(t.status),
  ).length;
  const ordered = sortTasksInPlanOrder(visible);
  const nextUpId = sortTasksInPlanOrder(tasks).find((t) =>
    OPEN_STATUSES.includes(t.status),
  )?.id;
  const vendors = new Map(vendorList.map((v) => [v.id, v]));
  const costs = new Map(
    budgetItems.flatMap((b) => (b.task_id ? [[b.task_id, b]] : [])),
  );

  return (
    <div className="mt-10 space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-base text-[#52635a]">Progress</p>
            <p className="text-3xl font-semibold">
              {finished} of {tasks.length} done or booked
            </p>
          </div>
          <nav aria-label="Filter tasks" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.id}
                href={`/?section=tasks&show=${f.id}`}
                aria-current={f.id === filter ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-base font-semibold ${
                  f.id === filter
                    ? "bg-[#315b4b] text-white"
                    : "border border-[#cfd8d0] text-[#294b40] hover:bg-[#f1f3ee]"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e6eee8]">
          <div
            className="h-full rounded-full bg-[#315b4b]"
            style={{
              width: `${tasks.length ? (finished / tasks.length) * 100 : 0}%`,
            }}
          />
        </div>
      </Card>

      {ctx.canEdit && (
        <Card>
          <CardTitle>Add a task</CardTitle>
          <form
            action={addTaskAction}
            className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto]"
          >
            <input type="hidden" name="weddingId" value={ctx.wedding.id} />
            <Field label="What needs doing?">
              <input
                name="title"
                required
                className={inputClass}
                placeholder="Order favors"
              />
            </Field>
            <Field label="Due date">
              <input name="dueDate" type="date" className={inputClass} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={primaryButtonClass}>
                Add task
              </button>
            </div>
          </form>
        </Card>
      )}

      {ordered.length === 0 ? (
        <EmptyState
          title={
            filter === "open"
              ? "Nothing left to do. Nice work!"
              : "No tasks here yet."
          }
        />
      ) : (
        <Card>
          <CardTitle>
            {filter === "planned" ? "Done and booked" : "In order of priority"}
          </CardTitle>
          {filter !== "planned" && (
            <p className="mt-1 text-base text-[#52635a]">
              The big decisions come first. Work down the list at your own pace.
            </p>
          )}
          <ul className="mt-3 divide-y divide-[#eceee8]">
            {ordered.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                ctx={ctx}
                nextUp={task.id === nextUpId}
                vendor={
                  task.vendor_id ? vendors.get(task.vendor_id) : undefined
                }
                cost={costs.get(task.id)}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TaskRow({
  task,
  ctx,
  nextUp,
  vendor,
  cost,
}: {
  task: Task;
  ctx: WeddingContext;
  nextUp: boolean;
  vendor?: Vendor;
  cost?: BudgetItem;
}) {
  const finished = PLANNED_STATUSES.includes(task.status);
  const dueDate = hasChosenDueDate(task) ? task.due_date : null;
  const overdue = !finished && dueDate !== null && dueDate < ctx.today;
  const amount = cost ? Number(cost.actual ?? cost.estimated) : undefined;
  const hasDetails = Boolean(vendor || cost || task.notes);
  const canUpdate = ctx.canEdit || task.assignee_id === ctx.me.id;
  const assignee = memberName(ctx, task.assignee_id);

  return (
    <li className="flex flex-wrap items-center gap-4 py-3">
      {canUpdate ? (
        <form action={setTaskStatusAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <input
            type="hidden"
            name="status"
            value={finished ? "todo" : "done"}
          />
          <button
            type="submit"
            aria-label={
              finished
                ? `Mark "${task.title}" as not done`
                : `Mark "${task.title}" as done`
            }
            className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${
              finished
                ? "border-[#315b4b] bg-[#315b4b] text-white"
                : "border-[#b8c6bc] bg-white text-transparent hover:border-[#315b4b] hover:text-[#9db4a3]"
            }`}
          >
            <Check className="h-6 w-6" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <span className="h-11 w-11" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-lg font-semibold ${finished ? "text-[#6b7a72] line-through" : ""}`}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-base text-[#52635a]">
          {nextUp && <Badge tone="info">Next up</Badge>}
          {dueDate && <span>Due {formatDate(dueDate)}</span>}
          {overdue && <Badge tone="warn">Overdue</Badge>}
          {task.status !== "todo" && (
            <Badge tone={finished ? "good" : "info"}>
              {STATUS_LABEL[task.status]}
            </Badge>
          )}
          {task.category && <Badge>{task.category}</Badge>}
          {assignee && <span>· {assignee}</span>}
        </p>
        {hasDetails && (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base text-[#2d4a3f]">
            {vendor && <span className="font-semibold">{vendor.name}</span>}
            {amount !== undefined && <span>· {formatMoney(amount)}</span>}
            {vendor?.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#315b4b] underline underline-offset-4"
              >
                · Website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {task.notes && (
              <span className="text-[#52635a]">· {task.notes}</span>
            )}
          </p>
        )}
      </div>
      {ctx.canEdit && (
        <form action={deleteTaskAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            aria-label={`Delete "${task.title}"`}
            className={quietButtonClass}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      )}
      {ctx.canEdit && (
        <details className="basis-full pl-15">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-base font-semibold text-[#315b4b] underline underline-offset-4">
            {finished
              ? hasDetails
                ? "Edit details"
                : "Add details"
              : "Done? Add what you chose"}
          </summary>
          <TaskDetailsForm
            taskId={task.id}
            submitLabel={finished ? "Save details" : "Save and mark done"}
            defaults={{
              name: vendor?.name,
              cost: amount,
              link: vendor?.website ?? undefined,
              notes: task.notes ?? undefined,
            }}
          />
        </details>
      )}
    </li>
  );
}
