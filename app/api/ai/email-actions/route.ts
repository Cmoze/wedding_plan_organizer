import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/client";
import { suggestEmailActions } from "@/lib/ai/email-actions";
import { aiErrorResponse, checkAiAccess, jsonError } from "@/lib/ai/http";
import { getCurrentUser } from "@/lib/db/auth";
import { getBudgetItems } from "@/lib/db/budget";
import { getEmail } from "@/lib/db/emails";
import { getGuestList } from "@/lib/db/guests";
import { getRegistryLinks } from "@/lib/db/registry";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { getTasks, OPEN_STATUSES } from "@/lib/db/tasks";
import { getVendors } from "@/lib/db/vendors";
import { getWedding } from "@/lib/db/weddings";

const Body = z.object({ emailId: z.guid() });

/**
 * POST { emailId } → { suggestions: EmailSuggestion[] }
 * Suggestions only; the client saves accepted ones with applyEmailSuggestion (lib/ai/suggestions).
 */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, "Send { emailId }");

  const db = await createClient();
  if (!(await getCurrentUser(db))) return jsonError(401, "Please log in");
  const email = await getEmail(db, body.data.emailId).catch(() => null);
  if (!email) return jsonError(404, "Email not found");

  const denied = await checkAiAccess(db, email.wedding_id, {
    editorsOnly: true,
  });
  if (denied) return denied;
  if (!isAiConfigured())
    return jsonError(503, "The AI helper isn't set up yet", "unavailable");

  try {
    const [wedding, vendors, budgetItems, openTasks, households, registries] =
      await Promise.all([
        getWedding(db, email.wedding_id),
        getVendors(db, email.wedding_id),
        getBudgetItems(db, email.wedding_id),
        getTasks(db, email.wedding_id, { status: OPEN_STATUSES }),
        getGuestList(db, email.wedding_id),
        getRegistryLinks(db, email.wedding_id),
      ]);
    const suggestions = await suggestEmailActions(email, {
      today: toDateString(new Date()),
      wedding,
      vendors,
      budgetItems,
      openTasks,
      households,
      registries,
    });
    return Response.json({ suggestions });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
