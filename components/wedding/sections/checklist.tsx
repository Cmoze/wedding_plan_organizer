import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ChecklistSuggestions } from "@/components/wedding/checklist-suggestions";
import { EditTaskForm } from "@/components/wedding/edit-forms";
import {
  DeleteTaskButton,
  NoticeProvider,
  TaskStatusButton,
  TaskDetailsForm,
  TaskDueDate,
  TaskForm,
} from "@/components/wedding/client-forms";
import { memberName, type WeddingContext } from "@/components/wedding/context";
import { formatDate, formatMoney } from "@/components/wedding/format";
import { Badge, Card, CardTitle, EmptyState } from "@/components/wedding/ui";
import { getBudgetItems, type BudgetItem } from "@/lib/db/budget";
import {
  OPEN_STATUSES,
  PLANNED_STATUSES,
  getTasks,
  setsTheBudget,
  sortTasksByDueDate,
  type Task,
} from "@/lib/db/tasks";
import { getVendors, type Vendor } from "@/lib/db/vendors";

const FILTERS = [
  { id: "open", label: "To do" },
  { id: "overdue", label: "Past due" },
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
        : filter === "overdue"
          ? OPEN_STATUSES.includes(t.status) &&
            t.due_date !== null &&
            t.due_date < ctx.today
          : PLANNED_STATUSES.includes(t.status),
  );
  const finished = tasks.filter((t) =>
    PLANNED_STATUSES.includes(t.status),
  ).length;
  const ordered = sortTasksByDueDate(visible);
  const nextUpId = sortTasksByDueDate(tasks).find((t) =>
    OPEN_STATUSES.includes(t.status),
  )?.id;
  const vendors = new Map(vendorList.map((v) => [v.id, v]));
  const costs = new Map(
    budgetItems.flatMap((b) => (b.task_id ? [[b.task_id, b]] : [])),
  );

  return (
    <NoticeProvider>
      <div className="mt-10 space-y-6">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-base text-[#695b60]">Progress</p>
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
                      ? "bg-[#6f1d37] text-white"
                      : "border border-[#ddcbd1] text-[#6f1d37] hover:bg-[#fbf3f5]"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#f4e7eb]">
            <div
              className="h-full rounded-full bg-[#6f1d37]"
              style={{
                width: `${tasks.length ? (finished / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </Card>

        {ctx.canEdit && (
          <ChecklistSuggestions
            weddingId={ctx.wedding.id}
            fresh={finished === 0}
          />
        )}

        {ctx.canEdit && (
          <Card>
            <CardTitle>Add a task</CardTitle>
            <TaskForm weddingId={ctx.wedding.id} />
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
              {filter === "planned"
                ? "Done and booked"
                : filter === "overdue"
                  ? "Past-due tasks"
                  : "By due date"}
            </CardTitle>
            {filter !== "planned" && (
              <p className="mt-1 text-base text-[#695b60]">
                Soonest first. The dates come from your wedding day, and you can
                change any of them.
              </p>
            )}
            <ul className="mt-3 divide-y divide-[#f0e8ea]">
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
    </NoticeProvider>
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
  const overdue =
    !finished && task.due_date !== null && task.due_date < ctx.today;
  const totalBudget = setsTheBudget(task);
  const budgetTotal =
    totalBudget && ctx.wedding.budget_total !== null
      ? Number(ctx.wedding.budget_total)
      : undefined;
  const amount = totalBudget
    ? budgetTotal
    : cost
      ? Number(cost.actual ?? cost.estimated)
      : undefined;
  const hasDetails = Boolean(vendor || amount !== undefined || task.notes);
  const canUpdate = ctx.canEdit || task.assignee_id === ctx.me.id;
  const assignee = memberName(ctx, task.assignee_id);

  return (
    <li className="flex flex-wrap items-center gap-4 py-3">
      {canUpdate ? (
        <TaskStatusButton
          taskId={task.id}
          title={task.title}
          finished={finished}
        />
      ) : (
        <span className="h-11 w-11" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-lg font-semibold ${finished ? "text-[#806c74] line-through" : ""}`}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-base text-[#695b60]">
          {nextUp && <Badge tone="info">Next up</Badge>}
          {ctx.canEdit ? (
            <TaskDueDate taskId={task.id} dueDate={task.due_date} />
          ) : (
            task.due_date && <span>Due {formatDate(task.due_date)}</span>
          )}
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
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base text-[#4b2734]">
            {vendor && <span className="font-semibold">{vendor.name}</span>}
            {amount !== undefined && (
              <span>
                {totalBudget
                  ? `Total budget ${formatMoney(amount)}`
                  : `· ${formatMoney(amount)}`}
              </span>
            )}
            {vendor?.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                · Website
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {task.notes && (
              <span className="text-[#695b60]">· {task.notes}</span>
            )}
          </p>
        )}
      </div>
      {ctx.canEdit && (
        <details className="basis-full">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[#ddcbd1] px-3 text-base font-semibold text-[#6f1d37] hover:bg-[#fbf3f5]">
            Edit task
          </summary>
          <div className="basis-full rounded-2xl bg-[#fffaf8] p-4 sm:p-5">
            <EditTaskForm task={task} members={ctx.members} />
          </div>
        </details>
      )}
      {ctx.canEdit && <DeleteTaskButton taskId={task.id} title={task.title} />}
      {ctx.canEdit && (
        <details className="basis-full pl-15">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-base font-semibold text-[#6f1d37] underline underline-offset-4">
            {finished
              ? hasDetails
                ? "Edit details"
                : "Add details"
              : totalBudget
                ? "Done? Add your total budget"
                : "Done? Add what you chose"}
          </summary>
          <TaskDetailsForm
            taskId={task.id}
            totalBudget={totalBudget}
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
