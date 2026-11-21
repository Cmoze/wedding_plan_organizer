import { unwrap, type Db, type Tables } from "@/lib/db/shared";
import type { Task } from "@/lib/db/tasks";

/** One row of the suggested checklist (spec 003). Nothing is added to a wedding until picked. */
export type ChecklistTemplate = Tables<"checklist_templates">;

export async function getChecklistTemplates(
  db: Db,
): Promise<ChecklistTemplate[]> {
  return unwrap(
    await db
      .from("checklist_templates")
      .select("*")
      .order("sort_order", { ascending: true }),
  );
}

/**
 * Adds the chosen suggestions to the wedding's checklist, with due dates worked out from the
 * wedding date. Skips any the wedding already has. Couple or planner only.
 */
export async function addTemplateTasks(
  db: Db,
  weddingId: string,
  templateIds: string[],
  /** The viewer's today (`YYYY-MM-DD`): suggestions already past are due then, not on UTC's today. */
  today?: string,
): Promise<Task[]> {
  if (templateIds.length === 0) return [];
  return unwrap(
    await db.rpc("add_template_tasks", {
      _wedding_id: weddingId,
      _template_ids: templateIds,
      ...(today ? { _today: today } : {}),
    }),
  );
}

export const SUGGESTION_PHASES = [
  { key: "year", label: "A year or more out", min: 12 },
  { key: "half", label: "6 to 11 months out", min: 6 },
  { key: "quarter", label: "3 to 5 months out", min: 3 },
  { key: "last", label: "The last two months", min: 0.5 },
  { key: "week", label: "The week of", min: 0 },
] as const;

export type SuggestionPhase = (typeof SUGGESTION_PHASES)[number];

export function phaseFor(monthsBefore: number): SuggestionPhase {
  return (
    SUGGESTION_PHASES.find((p) => monthsBefore >= p.min) ??
    SUGGESTION_PHASES[SUGGESTION_PHASES.length - 1]
  );
}

/** The suggestion that's pointless once the wedding has a date. */
export const PICK_DATE_TITLE = "Pick a wedding date";

/**
 * Suggestions grouped by phase, in plan order, leaving out any already on the checklist
 * and, once the wedding has a date, "Pick a wedding date".
 */
export function groupSuggestions<
  T extends Pick<
    ChecklistTemplate,
    "id" | "months_before" | "sort_order" | "title"
  >,
>(
  templates: T[],
  alreadyAdded: Iterable<string | null> = [],
  { hasWeddingDate = false }: { hasWeddingDate?: boolean } = {},
): { phase: SuggestionPhase; items: T[] }[] {
  const have = new Set(alreadyAdded);
  const sorted = templates
    .filter((t) => !have.has(t.id))
    .filter((t) => !(hasWeddingDate && t.title === PICK_DATE_TITLE))
    .sort((a, b) => a.sort_order - b.sort_order);
  return SUGGESTION_PHASES.map((phase) => ({
    phase,
    items: sorted.filter((t) => phaseFor(Number(t.months_before)) === phase),
  })).filter((g) => g.items.length > 0);
}
