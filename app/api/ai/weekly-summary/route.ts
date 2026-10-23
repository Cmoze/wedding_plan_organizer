import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAiConfigured } from "@/lib/ai/client";
import { aiErrorResponse, checkAiAccess, jsonError } from "@/lib/ai/http";
import { takeRateLimit } from "@/lib/ai/rate-limit";
import {
  fallbackWeeklySummary,
  getWeeklySummary,
  type WeeklySummary,
  type WeeklySummaryInput,
} from "@/lib/ai/weekly-summary";
import { getCurrentUser } from "@/lib/db/auth";
import { getBudgetItems } from "@/lib/db/budget";
import { toDateString } from "@/lib/db/shared";
import { createClient } from "@/lib/db/supabase/server";
import { getOverdueTasks, getTasks, OPEN_STATUSES } from "@/lib/db/tasks";
import { getMembers, getWedding } from "@/lib/db/weddings";

const WeddingId = z.guid();
const LOOKAHEAD_DAYS = 14;

// One summary per wedding per day unless the tasks change; saves a Claude call on every page load.
const cache = new Map<string, { key: string; summary: WeeklySummary }>();

/**
 * GET ?weddingId=… → WeeklySummary ({ headline, items, source })
 * Any member can call it. Falls back to a plain summary (source: "fallback") when AI is off.
 */
export async function GET(request: NextRequest) {
  const weddingId = WeddingId.safeParse(
    request.nextUrl.searchParams.get("weddingId"),
  );
  if (!weddingId.success) return jsonError(400, "Pass ?weddingId=");

  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return jsonError(401, "Please log in");
  const denied = await checkAiAccess(db, weddingId.data, { rateLimit: false });
  if (denied) return denied;

  try {
    const today = toDateString(new Date());
    const until = toDateString(
      new Date(Date.now() + LOOKAHEAD_DAYS * 86_400_000),
    );
    const [wedding, overdue, upcoming, budgetItems, members] =
      await Promise.all([
        getWedding(db, weddingId.data),
        getOverdueTasks(db, weddingId.data, today),
        getTasks(db, weddingId.data, {
          status: OPEN_STATUSES,
          dueFrom: today,
          dueTo: until,
        }),
        getBudgetItems(db, weddingId.data),
        getMembers(db, weddingId.data),
      ]);
    const input: WeeklySummaryInput = {
      today,
      weddingDate: wedding.wedding_date,
      overdue,
      upcoming,
      paymentsDue: budgetItems.filter(
        (b) =>
          b.due_date &&
          b.due_date <= until &&
          Number(b.actual ?? b.estimated) > Number(b.paid),
      ),
      memberNames: Object.fromEntries(
        members.map((m) => [m.id, m.display_name]),
      ),
    };

    const key = JSON.stringify(input);
    const cached = cache.get(weddingId.data);
    if (cached?.key === key) return Response.json(cached.summary);

    const summary =
      isAiConfigured() && takeRateLimit(user.id)
        ? await getWeeklySummary(input)
        : fallbackWeeklySummary(input);
    if (summary.source === "ai") cache.set(weddingId.data, { key, summary });
    return Response.json(summary);
  } catch (error) {
    return aiErrorResponse(error);
  }
}
