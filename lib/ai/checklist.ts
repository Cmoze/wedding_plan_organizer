import { z } from "zod";
import { generateStructured } from "@/lib/ai/client";
import {
  ChecklistSuggestionSchema,
  cleanDate,
  type ChecklistSuggestion,
} from "@/lib/ai/suggestions";
import type { Task } from "@/lib/db/tasks";
import type { Wedding } from "@/lib/db/weddings";

export type ChecklistInput = {
  /** `YYYY-MM-DD` */
  today: string;
  wedding: Pick<
    Wedding,
    "wedding_date" | "budget_total" | "guest_count_estimate"
  >;
  /** Open tasks (todo / in progress); most come from the standard checklist. */
  tasks: Pick<Task, "id" | "title" | "category" | "due_date">[];
  /** Titles of tasks already done or booked, so nothing gets re-suggested. */
  doneTitles: string[];
};

const SYSTEM = `You personalize a wedding planning checklist. The family started from a standard checklist with due dates counted back from the wedding date. Suggest changes that fit THIS wedding's timeline, guest count and budget.

You can suggest:
- add_task: something important for this wedding that's missing (e.g. a large guest count needs a room block and shuttle; a short engagement needs rush orders).
- move_task: a new due date for an open task whose date doesn't fit (e.g. it's already past and still matters, or a short timeline means it should happen sooner). Never move a task to a date before today.
- remove_task: a task that clearly doesn't apply (e.g. nothing to book far ahead when the wedding is in 6 weeks, or something that conflicts with a small budget). Be conservative.

Rules:
- At most 8 suggestions, most helpful first. Fewer is fine; return none if the checklist already fits.
- Use task_id values exactly as given. Don't suggest anything already done.
- Labels are short, friendly yes/no questions, e.g. "Book a hotel room block for out-of-town guests by Mar 1?". Plain words; readers are not technical.`;

const ResultSchema = z.object({
  suggestions: z.array(ChecklistSuggestionSchema),
});

export function buildChecklistPrompt(input: ChecklistInput): string {
  const { wedding } = input;
  const tasks = input.tasks.length
    ? input.tasks
        .map(
          (t) =>
            `- [${t.id}] ${t.title}${t.category ? ` (${t.category})` : ""}: due ${t.due_date ?? "no date"}`,
        )
        .join("\n")
    : "(none)";
  return `Today is ${input.today}.
Wedding date: ${wedding.wedding_date ?? "not set"}
Guest count (estimate): ${wedding.guest_count_estimate ?? "unknown"}
Total budget: ${wedding.budget_total === null ? "unknown" : `$${wedding.budget_total}`}

Open tasks:
${tasks}

Already done or booked:
${input.doneTitles.length ? input.doneTitles.map((t) => `- ${t}`).join("\n") : "(none)"}`;
}

/** Drops suggestions that point at unknown tasks or have unusable dates. */
export function cleanChecklistSuggestions(
  suggestions: ChecklistSuggestion[],
  input: ChecklistInput,
): ChecklistSuggestion[] {
  const ids = new Set(input.tasks.map((t) => t.id));
  return suggestions
    .map((s) => {
      if (s.kind === "add_task")
        return { ...s, due_date: cleanDate(s.due_date) };
      if (!ids.has(s.task_id)) return null;
      if (s.kind === "move_task") {
        const due = cleanDate(s.due_date);
        return due && due >= input.today ? { ...s, due_date: due } : null;
      }
      return s;
    })
    .filter((s): s is ChecklistSuggestion => s !== null)
    .slice(0, 8);
}

/** "Personalized checklist": tweaks to the standard checklist for this wedding's date, size and budget. */
export async function suggestChecklistChanges(
  input: ChecklistInput,
): Promise<ChecklistSuggestion[]> {
  const result = await generateStructured({
    schema: ResultSchema,
    system: SYSTEM,
    prompt: buildChecklistPrompt(input),
    effort: "medium",
  });
  return cleanChecklistSuggestions(result.suggestions, input);
}
