import { z } from "zod";
import { runAssistant } from "@/lib/ai/assistant";
import { isAiConfigured } from "@/lib/ai/client";
import { aiErrorResponse, checkAiAccess, jsonError } from "@/lib/ai/http";
import { getCurrentUser } from "@/lib/db/auth";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { canEdit, getMyMembership } from "@/lib/db/weddings";

const Body = z.object({
  weddingId: z.guid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      }),
    )
    .min(1)
    .max(100),
});

/**
 * POST { weddingId, messages } → { reply, actions } (lib/ai/assistant)
 * Any member can ask; only the couple or a planner is offered actions, which the client saves
 * with applyAssistantAction (lib/ai/assistant-actions). Uses the user's client, so RLS applies.
 */
export async function POST(request: Request) {
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return jsonError(400, "Send { weddingId, messages }");
  const { weddingId, messages } = body.data;

  const db = await createClient();
  if (!(await getCurrentUser(db))) return jsonError(401, "Please log in");
  const denied = await checkAiAccess(db, weddingId);
  if (denied) return denied;
  if (!isAiConfigured())
    return jsonError(503, "Piper isn't set up yet", "unavailable");

  try {
    const member = await getMyMembership(db, weddingId);
    const result = await runAssistant(
      {
        db,
        weddingId,
        canEdit: Boolean(member && canEdit(member.role)),
        today: toDateString(new Date()),
      },
      messages,
    );
    return Response.json(result);
  } catch (error) {
    return aiErrorResponse(error);
  }
}
