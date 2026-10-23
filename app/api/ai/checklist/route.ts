import { z } from "zod";
import { suggestChecklistChanges } from "@/lib/ai/checklist";
import { isAiConfigured } from "@/lib/ai/client";
import { aiErrorResponse, checkAiAccess, jsonError } from "@/lib/ai/http";
import { getCurrentUser } from "@/lib/db/auth";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { getTasks, OPEN_STATUSES } from "@/lib/db/tasks";
import { getWedding } from "@/lib/db/weddings";

const Body = z.object({ weddingId: z.guid() });

/**
 * POST { weddingId } → { suggestions: ChecklistSuggestion[] }
 * Suggestions only; the client saves accepted ones with applyChecklistSuggestion (lib/ai/suggestions).
 */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, "Send { weddingId }");
  const { weddingId } = body.data;

  const db = await createClient();
  if (!(await getCurrentUser(db))) return jsonError(401, "Please log in");
  const denied = await checkAiAccess(db, weddingId, { editorsOnly: true });
  if (denied) return denied;
  if (!isAiConfigured())
    return jsonError(503, "The AI helper isn't set up yet", "unavailable");

  try {
    const [wedding, tasks] = await Promise.all([
      getWedding(db, weddingId),
      getTasks(db, weddingId),
    ]);
    const suggestions = await suggestChecklistChanges({
      today: toDateString(new Date()),
      wedding,
      tasks: tasks.filter((t) => OPEN_STATUSES.includes(t.status)),
      doneTitles: tasks
        .filter((t) => !OPEN_STATUSES.includes(t.status))
        .map((t) => t.title),
    });
    return Response.json({ suggestions });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
