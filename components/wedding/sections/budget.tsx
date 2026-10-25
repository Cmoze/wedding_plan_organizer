import { Trash2 } from "lucide-react";
import {
  addBudgetItemAction,
  deleteBudgetItemAction,
  markBudgetItemPaidAction,
} from "@/app/actions";
import type { WeddingContext } from "@/components/wedding/context";
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
  secondaryButtonClass,
} from "@/components/wedding/ui";
import {
  getBudgetItems,
  summarizeBudget,
  type BudgetItem,
} from "@/lib/db/budget";

export async function BudgetSection({ ctx }: { ctx: WeddingContext }) {
  const items = await getBudgetItems(ctx.db, ctx.wedding.id);
  const summary = summarizeBudget(ctx.wedding.budget_total, items);
  const pct = summary.budgetTotal
    ? Math.min(100, (summary.committed / summary.budgetTotal) * 100)
    : 0;
  const over = summary.remaining !== null && summary.remaining < 0;
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total budget"
          value={
            summary.budgetTotal === null
              ? "Not set"
              : formatMoney(summary.budgetTotal)
          }
        />
        <Stat label="Planned spending" value={formatMoney(summary.committed)} />
        <Stat label="Paid so far" value={formatMoney(summary.paid)} />
        <Stat
          label={over ? "Over budget" : "Left to plan"}
          value={
            summary.remaining === null
              ? "—"
              : formatMoney(Math.abs(summary.remaining))
          }
          warn={over}
        />
      </div>

      {summary.budgetTotal !== null && (
        <Card>
          <div className="flex justify-between text-base font-semibold">
            <span>Planned vs. budget</span>
            <span>
              {Math.round((summary.committed / summary.budgetTotal) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#f4e7eb]">
            <div
              className={`h-full rounded-full ${over ? "bg-[#b4532a]" : "bg-[#6f1d37]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {summary.byCategory.length > 0 && (
            <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {summary.byCategory.map((c) => (
                <li key={c.category} className="flex justify-between text-base">
                  <span>{c.category}</span>
                  <span className="font-semibold">
                    {formatMoney(c.committed)}{" "}
                    <span className="font-normal text-[#806c74]">
                      ({formatMoney(c.paid)} paid)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {ctx.canEdit && (
        <Card>
          <CardTitle>Add an expense</CardTitle>
          <form
            action={addBudgetItemAction}
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="weddingId" value={ctx.wedding.id} />
            <Field label="Category">
              <input
                name="category"
                required
                list="budget-categories"
                className={inputClass}
                placeholder="Flowers"
              />
              <datalist id="budget-categories">
                {[
                  ...new Set([
                    ...categories,
                    "Venue",
                    "Catering",
                    "Photography",
                    "Flowers",
                    "Attire",
                    "Music",
                    "Decor",
                    "Stationery",
                  ]),
                ].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="What is it?">
              <input
                name="description"
                className={inputClass}
                placeholder="Centerpieces"
              />
            </Field>
            <Field label="Estimated cost ($)">
              <input
                name="estimated"
                inputMode="decimal"
                required
                className={inputClass}
                placeholder="1200"
              />
            </Field>
            <Field
              label="Actual cost ($)"
              hint="Leave blank until you have a quote."
            >
              <input name="actual" inputMode="decimal" className={inputClass} />
            </Field>
            <Field label="Payment due">
              <input name="dueDate" type="date" className={inputClass} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={primaryButtonClass}>
                Add expense
              </button>
            </div>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState title="No expenses yet">
          Add your first one above, like the venue deposit.
        </EmptyState>
      ) : (
        categories.map((category) => (
          <Card key={category}>
            <CardTitle>{category}</CardTitle>
            <ul className="mt-3 divide-y divide-[#f0e8ea]">
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <BudgetRow key={item.id} item={item} ctx={ctx} />
                ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#eadfe2] bg-white p-5">
      <p className="text-base text-[#695b60]">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${warn ? "text-[#b4532a]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function BudgetRow({ item, ctx }: { item: BudgetItem; ctx: WeddingContext }) {
  const cost = Number(item.actual ?? item.estimated);
  const paid = Number(item.paid);
  const fullyPaid = cost > 0 && paid >= cost;
  const overdue =
    !fullyPaid && item.due_date !== null && item.due_date < ctx.today;

  return (
    <li className="flex flex-wrap items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold">
          {item.description || item.category}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-base text-[#695b60]">
          <span>
            {item.actual === null
              ? `Estimate ${formatMoney(item.estimated)}`
              : `Cost ${formatMoney(item.actual)}`}
          </span>
          <span>· Paid {formatMoney(paid)}</span>
          {item.due_date && !fullyPaid && (
            <span>· Due {formatDate(item.due_date)}</span>
          )}
          {fullyPaid && <Badge tone="good">Paid</Badge>}
          {overdue && <Badge tone="warn">Overdue</Badge>}
        </p>
      </div>
      {ctx.canEdit && !fullyPaid && cost > 0 && (
        <form action={markBudgetItemPaidAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="amount" value={cost} />
          <button type="submit" className={secondaryButtonClass}>
            Mark paid
          </button>
        </form>
      )}
      {ctx.canEdit && (
        <form action={deleteBudgetItemAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button
            type="submit"
            aria-label={`Delete ${item.description || item.category}`}
            className={quietButtonClass}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      )}
    </li>
  );
}
