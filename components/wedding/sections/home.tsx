import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Heart,
  Wallet,
} from "lucide-react";
import { describeActivity, getActivity } from "@/lib/db/activity";
import { getBudgetSummary } from "@/lib/db/budget";
import { getCalendarItems } from "@/lib/db/calendar";
import {
  formatDate,
  formatMoney,
  parseDate,
  weddingTitle,
} from "@/components/wedding/format";
import {
  getAlreadyPlanned,
  getOverdueTasks,
  getTasks,
  OPEN_STATUSES,
} from "@/lib/db/tasks";
import type { WeddingContext } from "@/components/wedding/context";
import { CouplePhoto } from "@/components/wedding/couple-photo";
import { getCouplePhotoUrl } from "@/lib/db/weddings";

export async function HomeSection({ ctx }: { ctx: WeddingContext }) {
  const { wedding, db, today } = ctx;
  const [
    overdueTasks,
    calendarItems,
    budget,
    activity,
    weekTasks,
    plannedTasks,
    photoUrl,
  ] = await Promise.all([
    getOverdueTasks(db, wedding.id, today),
    getCalendarItems(db, wedding.id, {
      from: today,
      to: addDays(today, 45),
    }),
    getBudgetSummary(db, wedding.id),
    getActivity(db, wedding.id, 5),
    getTasks(db, wedding.id, {
      status: OPEN_STATUSES,
      dueFrom: today,
      dueTo: addDays(today, 7),
    }),
    getAlreadyPlanned(db, wedding.id),
    getCouplePhotoUrl(db, wedding),
  ]);
  const upcoming = calendarItems.filter((item) => !item.done).slice(0, 5);
  const myWeekTasks = weekTasks.filter(
    (task) => task.assignee_id === ctx.me.id,
  );
  const bookedTasks = plannedTasks.filter((task) => task.status === "booked");
  const daysToGo = wedding.wedding_date
    ? Math.ceil(
        (parseDate(wedding.wedding_date).getTime() -
          parseDate(today).getTime()) /
          86_400_000,
      )
    : null;
  const budgetPercent =
    budget.budgetTotal && budget.budgetTotal > 0
      ? Math.min(
          100,
          Math.max(0, (budget.committed / budget.budgetTotal) * 100),
        )
      : 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#6f1d37] px-6 py-8 text-white shadow-[0_20px_50px_-28px_rgba(80,20,43,0.55)] sm:px-9 sm:py-10 lg:px-12">
        <span className="pointer-events-none absolute -top-28 right-[-4rem] h-72 w-72 rounded-full border border-white/10 sm:right-10" />
        <span className="pointer-events-none absolute -top-16 right-[-1rem] h-52 w-52 rounded-full border border-white/10 sm:right-20" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-wrap items-center gap-5 sm:gap-7">
            <CouplePhoto
              weddingId={wedding.id}
              photoUrl={photoUrl}
              names={weddingTitle(wedding)}
              canEdit={ctx.canEdit}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[0.16em] text-[#f0dce3] uppercase">
                Your wedding workspace
              </p>
              <h1 className="font-heading mt-3 max-w-3xl text-4xl leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                {weddingTitle(wedding)}
              </h1>
              <p className="mt-3 text-base text-[#f3e8ec] sm:text-lg">
                {wedding.wedding_date
                  ? formatDate(wedding.wedding_date)
                  : "Choose your wedding date when you’re ready"}
              </p>
            </div>
          </div>
          <Link
            href="/?section=tasks"
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full border border-white/35 px-5 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:self-end"
          >
            Open checklist <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-8 flex flex-wrap items-end gap-x-8 gap-y-5 border-t border-white/20 pt-6 sm:mt-10 sm:gap-x-12">
          <div>
            <p className="font-heading text-5xl leading-none sm:text-6xl">
              {daysToGo === null ? "—" : Math.max(daysToGo, 0)}
            </p>
            <p className="mt-2 text-sm font-medium text-[#f0dce3]">
              {daysToGo !== null && daysToGo < 0
                ? "days since your day"
                : "days to go"}
            </p>
          </div>
          <div className="h-14 w-px bg-white/20" />
          <div>
            <p className="font-heading text-3xl leading-tight sm:text-4xl">
              {overdueTasks.length}
            </p>
            <p className="mt-2 text-sm font-medium text-[#f0dce3]">
              {overdueTasks.length === 1
                ? "task needs attention"
                : "tasks need attention"}
            </p>
          </div>
          <div className="h-14 w-px bg-white/20" />
          <div>
            <p className="font-heading text-3xl leading-tight sm:text-4xl">
              {upcoming.length}
            </p>
            <p className="mt-2 text-sm font-medium text-[#f0dce3]">
              plans coming up
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-[#956779] uppercase">
                Coming up
              </p>
              <h2 className="font-heading mt-2 text-2xl text-[#35151f] sm:text-3xl">
                The next little steps
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#6f1d37] hover:bg-[#fbf3f5]"
              href="/?section=calendar"
            >
              View calendar{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="mt-5 divide-y divide-[#f0e8ea]">
              {upcoming.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-center gap-4 py-4 first:pt-1 last:pb-1"
                >
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#fbf3f5] text-center text-[#6f1d37]">
                    {item.kind === "event" ? (
                      <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    ) : item.kind === "payment" ? (
                      <Wallet className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#3b2029]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-[#796a70]">
                      {formatDate(item.start)} ·{" "}
                      {item.kind === "event"
                        ? "Event"
                        : item.kind === "payment"
                          ? "Payment"
                          : "Task"}
                    </p>
                  </div>
                  <Clock3
                    className="hidden h-4 w-4 shrink-0 text-[#aa8794] sm:block"
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-[#fcf8f7] px-5 py-7 text-center">
              <CheckCircle2
                className="mx-auto h-7 w-7 text-[#8c3c58]"
                aria-hidden="true"
              />
              <p className="mt-2 font-semibold text-[#492734]">
                Nothing due in the next 45 days
              </p>
              <p className="mt-1 text-sm text-[#796a70]">
                Add a task or event whenever you’re ready.
              </p>
            </div>
          )}
        </section>

        <div className="grid content-start gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.14em] text-[#956779] uppercase">
              Your week
            </p>
            <h2 className="font-heading mt-1 text-xl text-[#35151f]">
              My tasks this week
            </h2>
            {myWeekTasks.length ? (
              <ul className="mt-3 space-y-2">
                {myWeekTasks.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="leading-5 font-semibold text-[#4b2734]">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-[#796a70]">
                      {formatDate(task.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#796a70]">
                No tasks assigned to you this week.
              </p>
            )}
            <Link
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#6f1d37] hover:underline"
              href="/?section=tasks"
            >
              Open checklist{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-[#f0d9dd] bg-[#fff9f8] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f9e9eb] text-[#9a3346]">
                <CircleAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-[0.14em] text-[#9a3346] uppercase">
                  Needs attention
                </p>
                <h2 className="font-heading mt-1 text-xl text-[#492734]">
                  {overdueTasks.length
                    ? "Past-due tasks"
                    : "You’re all caught up"}
                </h2>
              </div>
            </div>
            {overdueTasks.length ? (
              <ul className="mt-4 space-y-3">
                {overdueTasks.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="leading-5 font-semibold text-[#4b2734]">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-[#9a3346]">
                      {formatDate(task.due_date)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#796a70]">
                No open tasks are past their due date. Keep enjoying the
                progress.
              </p>
            )}
            <Link
              className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#6f1d37] hover:underline"
              href="/?section=tasks&show=overdue"
            >
              Review tasks <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.14em] text-[#956779] uppercase">
              Already planned
            </p>
            <h2 className="font-heading mt-1 text-xl text-[#35151f]">
              Booked and settled
            </h2>
            {bookedTasks.length ? (
              <ul className="mt-3 space-y-2">
                {bookedTasks.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 text-sm font-semibold text-[#4b2734]"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#8c3c58]"
                      aria-hidden="true"
                    />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#796a70]">
                Your confirmed plans will gather here.
              </p>
            )}
            <Link
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#6f1d37] hover:underline"
              href="/?section=tasks&show=planned"
            >
              See planned tasks{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-[#956779] uppercase">
                  Budget snapshot
                </p>
                <h2 className="font-heading mt-1 text-xl text-[#35151f]">
                  {formatMoney(budget.committed)} planned
                </h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7edf0] text-[#6f1d37]">
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0e8ea]">
              <div
                className="h-full rounded-full bg-[#8c3c58] transition-[width]"
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[#796a70]">
              {budget.budgetTotal === null
                ? "Set a total budget to see what remains."
                : `${formatMoney(budget.remaining)} remaining of ${formatMoney(budget.budgetTotal)}`}
            </p>
            <Link
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#6f1d37] hover:underline"
              href="/?section=budget"
            >
              Open budget <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>

      <section className="rounded-[1.75rem] border border-[#eadfe2] bg-white p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] text-[#956779] uppercase">
              Together, lately
            </p>
            <h2 className="font-heading mt-2 text-2xl text-[#35151f]">
              Recent activity
            </h2>
          </div>
          <Heart className="mb-1 h-5 w-5 text-[#a86478]" aria-hidden="true" />
        </div>
        {activity.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activity.slice(0, 3).map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#fcf8f7] p-4">
                <p className="text-sm leading-6 font-semibold text-[#4b2734]">
                  {describeActivity(item)}
                </p>
                <p className="mt-2 text-xs text-[#88777d]">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#796a70]">
            When your team updates a plan, you’ll see it here.
          </p>
        )}
      </section>
    </div>
  );
}

function addDays(date: string, count: number) {
  const value = parseDate(date);
  value.setDate(value.getDate() + count);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
