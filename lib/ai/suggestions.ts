import { z } from "zod";
import { createBudgetItem } from "@/lib/db/budget";
import { linkEmail } from "@/lib/db/emails";
import { createEvent } from "@/lib/db/events";
import { createGift } from "@/lib/db/gifts";
import { getGuestList } from "@/lib/db/guests";
import { getRegistryLinks } from "@/lib/db/registry";
import type { Db } from "@/lib/db/shared";
import { createTask, deleteTask, updateTask } from "@/lib/db/tasks";
import { createVendor, getVendors } from "@/lib/db/vendors";

/**
 * What the AI suggests, and how an accepted suggestion is saved.
 * AI never writes on its own: the UI shows `label` with Accept / Dismiss, and Accept calls
 * the matching `apply…` function with the signed-in user's client (RLS applies as usual).
 * Safe to import from Client Components (no secrets, no server-only code).
 */

const label = z
  .string()
  .describe(
    'One short question the user can accept, e.g. "Add $500 florist deposit due Nov 3 to the budget?"',
  );
const reason = z
  .string()
  .describe("Why: a short quote or fact from the source, under 20 words");
const date = z.string().describe("YYYY-MM-DD");

export const EmailSuggestionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("budget_item"),
    label,
    reason,
    category: z
      .string()
      .describe("Budget category, e.g. Venue, Flowers, Catering, Photography"),
    description: z.string(),
    amount: z.number().describe("Dollar amount of this cost or payment"),
    due_date: date.nullable(),
    vendor_name: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("task"),
    label,
    reason,
    title: z.string(),
    due_date: date.nullable(),
    category: z.string().nullable(),
    notes: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("event"),
    label,
    reason,
    title: z.string(),
    date,
    start_time: z.string().nullable().describe("HH:MM, 24-hour, or null"),
    location: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("vendor"),
    label,
    reason,
    name: z.string(),
    type: z.string().nullable().describe("e.g. Florist, Venue, Photographer"),
    contact_name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("gift"),
    label,
    reason,
    giver_name: z
      .string()
      .describe("Who sent the gift, as the email names them"),
    household_name: z
      .string()
      .nullable()
      .describe("The matching guest-list household, copied exactly, or null"),
    description: z.string().describe("What the gift is, e.g. Stand mixer"),
    store_name: z
      .string()
      .nullable()
      .describe("The registry store it was bought from, or null"),
    received_on: date.nullable(),
  }),
]);
export type EmailSuggestion = z.infer<typeof EmailSuggestionSchema>;

export const ChecklistSuggestionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("add_task"),
    label,
    reason,
    title: z.string(),
    category: z.string().nullable(),
    due_date: date.nullable(),
    notes: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("move_task"),
    label,
    reason,
    task_id: z.string(),
    due_date: date,
  }),
  z.object({
    kind: z.literal("remove_task"),
    label,
    reason,
    task_id: z.string(),
  }),
]);
export type ChecklistSuggestion = z.infer<typeof ChecklistSuggestionSchema>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` string that is a real date, else null (Claude occasionally gets this wrong). */
export function cleanDate(value: string | null): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

/** Best match by name (vendor, household, registry store): exact first, then one name containing the other. */
export function findByName<T extends { name: string }>(
  rows: T[],
  name: string | null,
): T | null {
  if (!name) return null;
  const wanted = normalize(name);
  return (
    rows.find((v) => normalize(v.name) === wanted) ??
    rows.find(
      (v) =>
        normalize(v.name).includes(wanted) ||
        wanted.includes(normalize(v.name)),
    ) ??
    null
  );
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Saves an accepted email suggestion and links the email to what was created.
 * Couple/planner only (RLS). Run it in the browser so event times use the user's time zone.
 */
export async function applyEmailSuggestion(
  db: Db,
  weddingId: string,
  suggestion: EmailSuggestion,
  emailId?: string,
): Promise<{ kind: EmailSuggestion["kind"]; id: string }> {
  switch (suggestion.kind) {
    case "budget_item": {
      const vendor = findByName(
        await getVendors(db, weddingId),
        suggestion.vendor_name,
      );
      const item = await createBudgetItem(db, weddingId, {
        category: suggestion.category,
        description: suggestion.description,
        estimated: suggestion.amount,
        due_date: cleanDate(suggestion.due_date),
        vendor_id: vendor?.id ?? null,
      });
      if (emailId) await linkEmail(db, emailId, { budgetItemId: item.id });
      return { kind: "budget_item", id: item.id };
    }
    case "task": {
      const task = await createTask(db, weddingId, {
        title: suggestion.title,
        due_date: cleanDate(suggestion.due_date),
        category: suggestion.category,
        notes: suggestion.notes,
      });
      if (emailId) await linkEmail(db, emailId, { taskId: task.id });
      return { kind: "task", id: task.id };
    }
    case "event": {
      const day = cleanDate(suggestion.date);
      if (!day) throw new Error("This suggestion has no valid date");
      const time = /^\d{2}:\d{2}$/.test(suggestion.start_time ?? "")
        ? suggestion.start_time
        : null;
      const event = await createEvent(db, weddingId, {
        title: suggestion.title,
        starts_at: new Date(`${day}T${time ?? "00:00"}`).toISOString(),
        all_day: !time,
        location: suggestion.location,
      });
      return { kind: "event", id: event.id };
    }
    case "vendor": {
      const vendor = await createVendor(db, weddingId, {
        name: suggestion.name,
        type: suggestion.type,
        contact_name: suggestion.contact_name,
        email: suggestion.email,
        phone: suggestion.phone,
        status: "contacted",
      });
      if (emailId) await linkEmail(db, emailId, { vendorId: vendor.id });
      return { kind: "vendor", id: vendor.id };
    }
    case "gift": {
      const [households, registries] = await Promise.all([
        getGuestList(db, weddingId),
        getRegistryLinks(db, weddingId),
      ]);
      const household = findByName(households, suggestion.household_name);
      const registry = findByName(
        registries.map((r) => ({ id: r.id, name: r.store_name })),
        suggestion.store_name,
      );
      const gift = await createGift(db, weddingId, {
        giver_name: suggestion.giver_name,
        description: suggestion.description,
        household_id: household?.id ?? null,
        registry_link_id: registry?.id ?? null,
        received_on: cleanDate(suggestion.received_on),
      });
      return { kind: "gift", id: gift.id };
    }
  }
}

/** Saves an accepted checklist suggestion. Couple/planner only (RLS). */
export async function applyChecklistSuggestion(
  db: Db,
  weddingId: string,
  suggestion: ChecklistSuggestion,
): Promise<void> {
  switch (suggestion.kind) {
    case "add_task":
      await createTask(db, weddingId, {
        title: suggestion.title,
        category: suggestion.category,
        due_date: cleanDate(suggestion.due_date),
        notes: suggestion.notes,
      });
      return;
    case "move_task": {
      const dueDate = cleanDate(suggestion.due_date);
      if (!dueDate) throw new Error("This suggestion has no valid date");
      await updateTask(db, suggestion.task_id, { due_date: dueDate });
      return;
    }
    case "remove_task":
      await deleteTask(db, suggestion.task_id);
      return;
  }
}
