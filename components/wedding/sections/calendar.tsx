import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteEventAction } from "@/app/actions";
import { EventForm, LocalTime } from "@/components/wedding/client-forms";
import type { WeddingContext } from "@/components/wedding/context";
import { formatDate, monthLabel, parseDate } from "@/components/wedding/format";
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
  task: { label: "Task", dot: "bg-[#315b4b]", tone: "good" },
  event: { label: "Event", dot: "bg-[#3d5f9c]", tone: "info" },
  payment: { label: "Payment", dot: "bg-[#b4532a]", tone: "warn" },
} as const;

const dayOf = (item: CalendarItem) => item.start.slice(0, 10);

export async function CalendarSection({
  ctx,
  month,
}: {
  ctx: WeddingContext;
  month?: string;
}) {
  const items = await getCalendarItems(ctx.db, ctx.wedding.id);
  const shown = /^\d{4}-\d{2}$/.test(month ?? "")
    ? month!
    : ctx.today.slice(0, 7);
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
          <h2 className="text-2xl font-semibold">
            {monthLabel(`${shown}-01`)}
          </h2>
          <Link
            href={`/?section=calendar&month=${shift(1)}`}
            aria-label="Next month"
            className={quietButtonClass}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>
        <MonthGrid first={first} items={items} ctx={ctx} />
        <p className="mt-4 flex flex-wrap gap-4 text-base text-[#52635a]">
          {Object.values(KIND).map((k) => (
            <span key={k.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${k.dot}`} /> {k.label}
            </span>
          ))}
        </p>
      </Card>

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

      {ctx.canEdit && (
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
  ctx,
}: {
  first: Date;
  items: CalendarItem[];
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
        <div key={d} className="pb-2 text-sm font-bold text-[#66756c]">
          {d}
        </div>
      ))}
      {cells.map((day, i) => {
        if (!day) return <div key={`blank-${i}`} />;
        const dayItems = byDay.get(day) ?? [];
        const isWedding = day === ctx.wedding.wedding_date;
        return (
          <div
            key={day}
            title={dayItems.map((d) => d.title).join("\n") || undefined}
            className={`min-h-16 rounded-xl border p-1.5 text-left sm:min-h-20 ${
              isWedding
                ? "border-[#315b4b] bg-[#e6eee8]"
                : day === ctx.today
                  ? "border-[#9db4a3] bg-[#fbfaf7]"
                  : "border-[#eceee8]"
            }`}
          >
            <span
              className={`text-sm font-semibold ${day === ctx.today ? "text-[#315b4b]" : ""}`}
            >
              {Number(day.slice(8))}
            </span>
            {isWedding && (
              <span className="block text-xs font-bold text-[#315b4b]">
                Wedding!
              </span>
            )}
            <span className="mt-1 flex flex-wrap gap-1">
              {dayItems.slice(0, 4).map((item) => (
                <span
                  key={`${item.kind}-${item.id}`}
                  className={`h-2.5 w-2.5 rounded-full ${KIND[item.kind].dot} ${item.done ? "opacity-40" : ""}`}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ItemList({
  items,
  ctx,
}: {
  items: CalendarItem[];
  ctx: WeddingContext;
}) {
  return (
    <ul className="mt-3 divide-y divide-[#eceee8]">
      {items.map((item) => (
        <li
          key={`${item.kind}-${item.id}`}
          className="flex flex-wrap items-center gap-3 py-3"
        >
          <Badge tone={KIND[item.kind].tone}>{KIND[item.kind].label}</Badge>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">{item.title}</p>
            <p className="text-base text-[#52635a]">
              {formatDate(dayOf(item))}
              {item.kind === "event" && (
                <>
                  {" · "}
                  <LocalTime iso={item.start} allDay={item.allDay} />
                </>
              )}
            </p>
          </div>
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
      ))}
    </ul>
  );
}
