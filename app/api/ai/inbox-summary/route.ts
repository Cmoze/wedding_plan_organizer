import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/client";
import { INBOX_MAX_EMAILS, summarizeInbox } from "@/lib/ai/inbox-summary";
import { aiErrorResponse, checkAiAccess, jsonError } from "@/lib/ai/http";
import { getCurrentUser } from "@/lib/db/auth";
import { getBudgetItems } from "@/lib/db/budget";
import { getEmail, getEmails } from "@/lib/db/emails";
import { getGuestList } from "@/lib/db/guests";
import { getRegistryLinks } from "@/lib/db/registry";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { getTasks, OPEN_STATUSES } from "@/lib/db/tasks";
import { getVendors } from "@/lib/db/vendors";
import { getWedding } from "@/lib/db/weddings";

const Body = z.object({
  weddingId: z.guid(),
  question: z.string().max(500).optional(),
});

/**
 * POST { weddingId, question? } → InboxSummary (lib/ai/inbox-summary)
 * Reads the newest emails, answers the question and suggests actions. Suggestions only;
 * the client saves accepted ones with applyEmailSuggestion (lib/ai/suggestions).
 */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, "Send { weddingId, question? }");
  const { weddingId, question = "" } = body.data;

  const db = await createClient();
  if (!(await getCurrentUser(db))) return jsonError(401, "Please log in");
  const denied = await checkAiAccess(db, weddingId, { editorsOnly: true });
  if (denied) return denied;
  if (!isAiConfigured())
    return jsonError(503, "The AI helper isn't set up yet", "unavailable");

  try {
    const [
      list,
      wedding,
      vendors,
      budgetItems,
      openTasks,
      households,
      registries,
    ] = await Promise.all([
      getEmails(db, weddingId),
      getWedding(db, weddingId),
      getVendors(db, weddingId),
      getBudgetItems(db, weddingId),
      getTasks(db, weddingId, { status: OPEN_STATUSES }),
      getGuestList(db, weddingId),
      getRegistryLinks(db, weddingId),
    ]);
    const emails = await Promise.all(
      list.slice(0, INBOX_MAX_EMAILS).map((e) => getEmail(db, e.id)),
    );
    const result = await summarizeInbox(
      emails,
      {
        today: toDateString(new Date()),
        wedding,
        vendors,
        budgetItems,
        openTasks,
        households,
        registries,
      },
      question,
    );
    return Response.json({ ...result, emailCount: emails.length });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
