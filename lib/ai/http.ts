import "server-only";
import { AiError, type AiErrorCode } from "@/lib/ai/client";
import { takeRateLimit } from "@/lib/ai/rate-limit";
import type { Db } from "@/lib/db/shared";
import { canEdit, getMyMembership } from "@/lib/db/weddings";

/** Helpers shared by the `app/api/ai/*` routes. */

export function jsonError(status: number, error: string, code?: string) {
  return Response.json({ error, code }, { status });
}

const STATUS: Record<AiErrorCode, number> = {
  unavailable: 503,
  rate_limited: 429,
  bad_output: 502,
};

/** AiError → a friendly JSON error the UI can show next to a "try again" button. */
export function aiErrorResponse(error: unknown) {
  if (error instanceof AiError)
    return jsonError(STATUS[error.code], error.message, error.code);
  console.error("[ai] route failed", error);
  return jsonError(500, "Something went wrong");
}

/**
 * Checks the signed-in user belongs to the wedding (and can edit, if required) and is under
 * the AI rate limit. Returns an error Response to send back, or null when allowed.
 */
export async function checkAiAccess(
  db: Db,
  weddingId: string,
  options: { editorsOnly?: boolean; rateLimit?: boolean } = {},
): Promise<Response | null> {
  const member = await getMyMembership(db, weddingId).catch(() => null);
  if (!member) return jsonError(403, "You're not part of this wedding");
  if (options.editorsOnly && !canEdit(member.role))
    return jsonError(403, "Only the couple or a planner can use this");
  if (options.rateLimit !== false && !takeRateLimit(member.user_id))
    return jsonError(
      429,
      "You've used the AI helper a lot just now. Try again in a few minutes.",
      "rate_limited",
    );
  return null;
}
