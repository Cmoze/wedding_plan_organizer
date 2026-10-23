import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type WeddingEvent = Tables<"events">;

/** Events overlapping an optional ISO time range, earliest first. */
export async function getEvents(
  db: Db,
  weddingId: string,
  range: { from?: string; to?: string } = {},
): Promise<WeddingEvent[]> {
  let query = db.from("events").select("*").eq("wedding_id", weddingId);
  if (range.from)
    query = query.or(`ends_at.gte.${range.from},starts_at.gte.${range.from}`);
  if (range.to) query = query.lte("starts_at", range.to);
  return unwrap(await query.order("starts_at"));
}

export async function createEvent(
  db: Db,
  weddingId: string,
  input: NewRow<"events">,
): Promise<WeddingEvent> {
  return unwrap(
    await db
      .from("events")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateEvent(
  db: Db,
  eventId: string,
  patch: RowPatch<"events">,
): Promise<WeddingEvent> {
  return unwrap(
    await db.from("events").update(patch).eq("id", eventId).select().single(),
  );
}

export async function deleteEvent(db: Db, eventId: string): Promise<void> {
  unwrap(await db.from("events").delete().eq("id", eventId));
}
