import { z } from "zod";
import {
  applyEmailSuggestion,
  EmailSuggestionSchema,
} from "@/lib/ai/suggestions";
import { setThankYouSent } from "@/lib/db/gifts";
import { updateGuest } from "@/lib/db/guests";
import type { Db } from "@/lib/db/shared";
import { updateTask } from "@/lib/db/tasks";

/**
 * What the site assistant can offer to do. Like email suggestions, nothing is saved by the AI:
 * the chat shows `label` with "Yes, do it", and the browser calls applyAssistantAction with the
 * signed-in user's client (RLS applies). Safe to import from Client Components.
 */

const label = z
  .string()
  .describe(
    "One short yes/no question with the key facts, e.g. \"Mark 'Book the florist' as done?\"",
  );
const reason = z
  .string()
  .describe("Why: what the user asked for, under 20 words");

export const AssistantActionSchema = z.discriminatedUnion("kind", [
  ...EmailSuggestionSchema.options,
  z.object({
    kind: z.literal("complete_task"),
    label,
    reason,
    task_id: z.string(),
  }),
  z.object({
    kind: z.literal("set_rsvp"),
    label,
    reason,
    guest_id: z.string(),
    rsvp: z.enum(["attending", "declined", "pending"]),
  }),
  z.object({
    kind: z.literal("mark_thank_you_sent"),
    label,
    reason,
    gift_id: z.string(),
  }),
]);
export type AssistantAction = z.infer<typeof AssistantActionSchema>;

export const ACTION_KIND_LABEL: Record<AssistantAction["kind"], string> = {
  budget_item: "Budget",
  task: "Checklist",
  event: "Calendar",
  vendor: "Vendor",
  gift: "Gift",
  complete_task: "Checklist",
  set_rsvp: "RSVP",
  mark_thank_you_sent: "Thank-you card",
};

/** Saves an accepted assistant action. Couple/planner only (RLS). Run it in the browser. */
export async function applyAssistantAction(
  db: Db,
  weddingId: string,
  action: AssistantAction,
): Promise<void> {
  switch (action.kind) {
    case "complete_task":
      await updateTask(db, action.task_id, {
        status: "done",
        completed_at: new Date().toISOString(),
      });
      return;
    case "set_rsvp":
      await updateGuest(db, action.guest_id, { rsvp: action.rsvp });
      return;
    case "mark_thank_you_sent":
      await setThankYouSent(db, [action.gift_id], true);
      return;
    default:
      await applyEmailSuggestion(db, weddingId, action);
  }
}
