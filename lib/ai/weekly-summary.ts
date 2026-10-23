import { z } from "zod";
import { AiError, generateStructured } from "@/lib/ai/client";
import type { BudgetItem } from "@/lib/db/budget";
import type { Task } from "@/lib/db/tasks";

export type WeeklySummaryInput = {
  /** `YYYY-MM-DD` */
  today: string;
  weddingDate: string | null;
  overdue: Pick<Task, "id" | "title" | "due_date" | "assignee_id">[];
  upcoming: Pick<Task, "id" | "title" | "due_date" | "assignee_id">[];
  paymentsDue: Pick<
    BudgetItem,
    "description" | "estimated" | "actual" | "paid" | "due_date"
  >[];
  /** members.id → display name, for "who's on it". */
  memberNames: Record<string, string>;
};

export type WeeklySummary = {
  headline: string;
  items: { title: string; detail: string; taskId: string | null }[];
  /** "ai" when Claude wrote it, "fallback" when it was built without AI. */
  source: "ai" | "fallback";
};

const SYSTEM = `You write the "What should we do this week?" card on a wedding planner's home screen. The readers are a couple and their parents; keep it warm, plain and short.

- headline: one sentence (under 20 words) that sums up the week, mentioning how far away the wedding is if known.
- items: the 3 to 5 most important things to do this week, overdue items and money due first. Each has a short title (under 8 words) and a detail sentence that says why it matters or what to do first, and who's on it if assigned.
- Set task_id to the id of the task the item is about, or null if it's about a payment or a combined reminder.
- Only use the tasks and payments given. Don't invent new ones.`;

const ResultSchema = z.object({
  headline: z.string(),
  items: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      task_id: z.string().nullable(),
    }),
  ),
});

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function owed(p: WeeklySummaryInput["paymentsDue"][number]): number {
  return Math.max(0, Number(p.actual ?? p.estimated) - Number(p.paid));
}

export function buildWeeklyPrompt(input: WeeklySummaryInput): string {
  const who = (id: string | null) =>
    id && input.memberNames[id] ? `, assigned to ${input.memberNames[id]}` : "";
  const tasks = (rows: WeeklySummaryInput["overdue"]) =>
    rows.length
      ? rows
          .map(
            (t) =>
              `- [${t.id}] ${t.title} (due ${t.due_date}${who(t.assignee_id)})`,
          )
          .join("\n")
      : "(none)";
  const payments = input.paymentsDue.length
    ? input.paymentsDue
        .map((p) => `- ${p.description}: $${owed(p)} due ${p.due_date}`)
        .join("\n")
    : "(none)";
  const countdown = input.weddingDate
    ? `The wedding is on ${input.weddingDate}, ${daysBetween(input.today, input.weddingDate)} days from today.`
    : "The wedding date isn't set yet.";
  return `Today is ${input.today}. ${countdown}

Overdue tasks:
${tasks(input.overdue)}

Tasks due in the next two weeks:
${tasks(input.upcoming)}

Payments due in the next two weeks:
${payments}`;
}

/** The same card without AI, so the dashboard still works when Claude is down or not set up. */
export function fallbackWeeklySummary(
  input: WeeklySummaryInput,
): WeeklySummary {
  const days = input.weddingDate
    ? daysBetween(input.today, input.weddingDate)
    : null;
  const countdown =
    days === null
      ? "Set your wedding date to see a countdown."
      : days >= 0
        ? `${days} days to go.`
        : "Congratulations!";
  const items: WeeklySummary["items"] = [
    ...input.overdue.map((t) => ({
      title: t.title,
      detail: `Overdue since ${t.due_date}.`,
      taskId: t.id,
    })),
    ...input.paymentsDue.map((p) => ({
      title: `Pay ${p.description}`,
      detail: `$${owed(p)} due ${p.due_date}.`,
      taskId: null,
    })),
    ...input.upcoming.map((t) => ({
      title: t.title,
      detail: `Due ${t.due_date}.`,
      taskId: t.id,
    })),
  ].slice(0, 5);
  const headline =
    items.length === 0
      ? `Nothing urgent this week. ${countdown}`
      : `${items.length} thing${items.length === 1 ? "" : "s"} to focus on this week. ${countdown}`;
  return { headline, items, source: "fallback" };
}

/**
 * "What should we do this week?" Never throws for AI trouble: falls back to a plain summary.
 */
export async function getWeeklySummary(
  input: WeeklySummaryInput,
): Promise<WeeklySummary> {
  if (
    input.overdue.length + input.upcoming.length + input.paymentsDue.length ===
    0
  )
    return fallbackWeeklySummary(input);
  try {
    const result = await generateStructured({
      schema: ResultSchema,
      system: SYSTEM,
      prompt: buildWeeklyPrompt(input),
      effort: "low",
    });
    const taskIds = new Set(
      [...input.overdue, ...input.upcoming].map((t) => t.id),
    );
    return {
      headline: result.headline,
      items: result.items.slice(0, 5).map((item) => ({
        title: item.title,
        detail: item.detail,
        taskId: item.task_id && taskIds.has(item.task_id) ? item.task_id : null,
      })),
      source: "ai",
    };
  } catch (error) {
    if (!(error instanceof AiError)) throw error;
    return fallbackWeeklySummary(input);
  }
}
