import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { deleteEventAction } from "@/app/actions";
import { EditCalendarEventForm } from "@/components/wedding/edit-forms";
import { EventForm, LocalTime } from "@/components/wedding/client-forms";
import type { WeddingContext } from "@/components/wedding/context";
import {
  formatDate,
  formatMoney,
  monthLabel,
  parseDate,
} from "@/components/wedding/format";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  quietButtonClass,
} from "@/components/wedding/ui";
import { getCalendarItems, type CalendarItem } from "@/lib/db/calendar";
import { toDateString } from "@/lib/db/shared";

const KIND = {
  task: {
    label: "Task",
    dot: "bg-[#6f1d37]",
    chip: "bg-[#f4e7eb] text-[#6f1d37]",
    tone: "good",
    href: "/?section=tasks",
    open: "Open tasks",
  },
  event: {
    label: "Event",
    dot: "bg-[#3d5f9c]",
    chip: "bg-[#e6ecf6] text-[#2f4b7c]",
    tone: "info",
    href: null,
    open: null,
  },
  payment: {
    label: "Payment",
    dot: "bg-[#b4532a]",
    chip: "bg-[#f8e9e0] text-[#8e3f1e]",
    tone: "warn",
    href: "/?section=budget",
    open: "Open budget",
  },
} as const;

const CHIPS_PER_DAY = 3;

const dayOf = (item: CalendarItem) => item.start.slice(0, 10);

export async function CalendarSection({
  ctx,
  month,
  day,
}: {
  ctx: WeddingContext;
  month?: string;
  /** `YYYY-MM-DD`: the day whose details are open. */
  day?: string;
}) {
  const items = await getCalendarItems(ctx.db, ctx.wedding.id);
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(day ?? "") ? day : undefined;
  const shown = /^\d{4}-\d{2}$/.test(month ?? "")
    ? month!
    : (validDay ?? ctx.today).slice(0, 7);
  const selected =
    validDay?.startsWith(shown) === true
      ? validDay
      : ctx.today.startsWith(shown)
        ? ctx.today
        : undefined;
  const first = parseDate(`${shown}-01`);
  const shift = (n: number) =>
    toDateString(new Date(first.getFullYear(), first.getMonth() + n, 1)).slice(
      0,
      7,
    );

  const upcoming = items
    .filter((i) => dayOf(i) >= ctx.today && !i.done)
    .slice(0, 15);
  const overdue = items.filter(
    (i) => dayOf(i) < ctx.today && !i.done && i.kind !== "event",
  );
  const selectedItems = selected
    ? items.filter((i) => dayOf(i) === selected)
    : [];

  return (
    <div className="mt-10 space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/?section=calendar&month=${shift(-1)}`}
            aria-label="Previous month"
            className={quietButtonClass}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </Link>
          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              {monthLabel(`${shown}-01`)}
            </h2>
            {!ctx.today.startsWith(shown) && (
              <Link
                href="/?section=calendar"
                className="text-sm font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                Back to today
              </Link>
            )}
          </div>
          <Link
            href={`/?section=calendar&month=${shift(1)}`}
            aria-label="Next month"
            className={quietButtonClass}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>
        <MonthGrid first={first} items={items} selected={selected} ctx={ctx} />
        <p className="mt-4 flex flex-wrap gap-4 text-base text-[#695b60]">
          {Object.values(KIND).map((k) => (
            <span key={k.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${k.dot}`} /> {k.label}
            </span>
          ))}
          <span className="text-[#806c74]">
            Tap a day to see what&apos;s on it.
          </span>
        </p>
      </Card>

      {selected && (
        <Card>
          <CardTitle>{formatDate(selected)}</CardTitle>
          {selected === ctx.wedding.wedding_date && (
            <p className="mt-1 text-base font-semibold text-[#6f1d37]">
              Your wedding day!
            </p>
          )}
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-base text-[#695b60]">
              Nothing on this day yet.
            </p>
          ) : (
            <ItemList items={selectedItems} ctx={ctx} showDate={false} />
          )}
          {ctx.canEdit && (
            <div className="mt-4 border-t border-[#f0e8ea] pt-4">
              <h3 className="text-lg font-semibold">Add an event this day</h3>
              <EventForm
                key={selected}
                weddingId={ctx.wedding.id}
                defaultDate={selected}
              />
            </div>
          )}
        </Card>
      )}

      {overdue.length > 0 && (
        <Card className="border-[#efc9b4]">
          <CardTitle>Overdue</CardTitle>
          <ItemList items={overdue} ctx={ctx} />
        </Card>
      )}

      <Card>
        <CardTitle>Coming up</CardTitle>
        {upcoming.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing scheduled yet" />
          </div>
        ) : (
          <ItemList items={upcoming} ctx={ctx} />
        )}
      </Card>

      {ctx.canEdit && !selected && (
        <Card>
          <CardTitle>Add an event</CardTitle>
          <EventForm weddingId={ctx.wedding.id} />
        </Card>
      )}
    </div>
  );
}

function MonthGrid({
  first,
  items,
  selected,
  ctx,
}: {
  first: Date;
  items: CalendarItem[];
  selected?: string;
  ctx: WeddingContext;
}) {
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateString(new Date(first.getFullYear(), first.getMonth(), i + 1)),
    ),
  ];
  const byDay = new Map<string, CalendarItem[]>();
  for (const item of items)
    byDay.set(dayOf(item), [...(byDay.get(dayOf(item)) ?? []), item]);

  return (
    <div className="mt-5 grid grid-cols-7 gap-1 text-center">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="pb-2 text-sm font-bold text-[#806c74]">
          {d}
        </div>
      ))}
      {cells.map((day, i) => {
        if (!day) return <div key={`blank-${i}`} />;
        const dayItems = byDay.get(day) ?? [];
        const isWedding = day === ctx.wedding.wedding_date;
        const extra = dayItems.length - CHIPS_PER_DAY;
        return (
          <Link
            key={day}
            href={`/?section=calendar&month=${day.slice(0, 7)}&day=${day}`}
            scroll={false}
            aria-label={`${formatDate(day)}${dayItems.length ? `, ${dayItems.length} ${dayItems.length === 1 ? "item" : "items"}` : ""}`}
            aria-current={day === selected ? "date" : undefined}
            title={dayItems.map((d) => d.title).join("\n") || undefined}
            className={`min-h-16 min-w-0 rounded-xl border p-1.5 text-left transition-colors hover:border-[#cba7b4] hover:bg-[#fbf5f7] sm:min-h-24 ${
              day === selected
                ? "border-[#6f1d37] ring-2 ring-[#6f1d37]/30"
                : isWedding
                  ? "border-[#6f1d37]"
                  : day === ctx.today
                    ? "border-[#cba7b4]"
                    : "border-[#f0e8ea]"
            } ${isWedding ? "bg-[#f4e7eb]" : "bg-[#fffdfb]"}`}
          >
            <span
              className={`text-sm font-semibold ${day === ctx.today ? "text-[#6f1d37]" : ""}`}
            >
              {Number(day.slice(8))}
            </span>
            {isWedding && (
              <span className="block truncate text-xs font-bold text-[#6f1d37]">
                Wedding!
              </span>
            )}
            <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
              {dayItems.slice(0, 4).map((item) => (
                <span
                  key={`${item.kind}-${item.id}`}
                  className={`h-2.5 w-2.5 rounded-full ${KIND[item.kind].dot} ${item.done ? "opacity-40" : ""}`}
                />
              ))}
            </span>
            <span className="mt-1 hidden space-y-0.5 sm:block">
              {dayItems.slice(0, CHIPS_PER_DAY).map((item) => (
                <span
                  key={`${item.kind}-${item.id}`}
                  className={`block truncate rounded px-1 py-0.5 text-xs font-semibold ${KIND[item.kind].chip} ${item.done ? "line-through opacity-50" : ""}`}
                >
                  {item.title.replace(/^Payment due: /, "")}
                </span>
              ))}
              {extra > 0 && (
                <span className="block px-1 text-xs font-semibold text-[#806c74]">
                  +{extra} more
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ItemList({
  items,
  ctx,
  showDate = true,
}: {
  items: CalendarItem[];
  ctx: WeddingContext;
  showDate?: boolean;
}) {
  return (
    <ul className="mt-3 divide-y divide-[#f0e8ea]">
      {items.map((item) => {
        const kind = KIND[item.kind];
        const details = [
          showDate && formatDate(dayOf(item)),
          item.kind === "event" && (
            <LocalTime key="time" iso={item.start} allDay={item.allDay} />
          ),
          item.location,
          item.amountDue ? `${formatMoney(item.amountDue)} due` : null,
          item.done && (item.kind === "payment" ? "Paid" : "Done"),
        ].filter(Boolean);
        return (
          <li
            key={`${item.kind}-${item.id}`}
            className="flex flex-wrap items-center gap-3 py-3"
          >
            <Badge tone={kind.tone}>{kind.label}</Badge>
            <div className="min-w-0 flex-1">
              <p
                className={`text-lg font-semibold ${item.done ? "text-[#806c74] line-through" : ""}`}
              >
                {item.title}
              </p>
              <p className="text-base text-[#695b60]">
                {details.map((d, i) => (
                  <Fragment key={i}>
                    {i > 0 && " · "}
                    {d}
                  </Fragment>
                ))}
              </p>
            </div>
            {kind.href && (
              <Link
                href={kind.href}
                className="text-base font-semibold text-[#6f1d37] underline underline-offset-4"
              >
                {kind.open}
              </Link>
            )}
            {item.kind === "event" && ctx.canEdit && (
              <details className="basis-full">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[#ddcbd1] px-3 text-base font-semibold text-[#6f1d37] hover:bg-[#fbf3f5]">
                  Edit event
                </summary>
                <div className="rounded-2xl bg-[#fffaf8] p-4 sm:p-5">
                  <EditCalendarEventForm event={item} />
                </div>
              </details>
            )}
            {item.kind === "event" && ctx.canEdit && (
              <form action={deleteEventAction}>
                <input type="hidden" name="eventId" value={item.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${item.title}`}
                  className={quietButtonClass}
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
