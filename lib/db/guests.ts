import type { ImportedHousehold } from "@/lib/db/guest-csv";
import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type Household = Tables<"households">;
export type Guest = Tables<"guests">;
export type HouseholdWithGuests = Household & { guests: Guest[] };

/** Every household with its guests, alphabetical. */
export async function getGuestList(
  db: Db,
  weddingId: string,
): Promise<HouseholdWithGuests[]> {
  return unwrap(
    await db
      .from("households")
      .select("*, guests(*)")
      .eq("wedding_id", weddingId)
      .order("name")
      .order("created_at", { referencedTable: "guests" }),
  );
}

export async function createHousehold(
  db: Db,
  weddingId: string,
  input: NewRow<"households">,
): Promise<Household> {
  return unwrap(
    await db
      .from("households")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateHousehold(
  db: Db,
  householdId: string,
  patch: RowPatch<"households">,
): Promise<Household> {
  return unwrap(
    await db
      .from("households")
      .update(patch)
      .eq("id", householdId)
      .select()
      .single(),
  );
}

/** Also deletes the household's guests. */
export async function deleteHousehold(
  db: Db,
  householdId: string,
): Promise<void> {
  unwrap(await db.from("households").delete().eq("id", householdId));
}

export async function createGuest(
  db: Db,
  weddingId: string,
  input: NewRow<"guests">,
): Promise<Guest> {
  return unwrap(
    await db
      .from("guests")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateGuest(
  db: Db,
  guestId: string,
  patch: RowPatch<"guests">,
): Promise<Guest> {
  return unwrap(
    await db.from("guests").update(patch).eq("id", guestId).select().single(),
  );
}

export async function deleteGuest(db: Db, guestId: string): Promise<void> {
  unwrap(await db.from("guests").delete().eq("id", guestId));
}

export type GuestCounts = {
  households: number;
  invited: number;
  attending: number;
  declined: number;
  pending: number;
  children: number;
};

export function countGuests(households: HouseholdWithGuests[]): GuestCounts {
  const guests = households.flatMap((h) => h.guests);
  return {
    households: households.length,
    invited: guests.length,
    attending: guests.filter((g) => g.rsvp === "attending").length,
    declined: guests.filter((g) => g.rsvp === "declined").length,
    pending: guests.filter((g) => g.rsvp === "pending").length,
    children: guests.filter((g) => g.is_child).length,
  };
}

/**
 * Saves the households from a CSV import preview (see parseGuestCsv in lib/db/guest-csv.ts).
 * Returns how many households and guests were created.
 */
export async function importGuests(
  db: Db,
  weddingId: string,
  households: ImportedHousehold[],
): Promise<{ households: number; guests: number }> {
  if (households.length === 0) return { households: 0, guests: 0 };
  const created = unwrap(
    await db
      .from("households")
      .insert(
        households.map((h) => {
          const { guests, ...household } = h;
          void guests;
          return { ...household, wedding_id: weddingId };
        }),
      )
      .select("id"),
  );
  const guestRows = households.flatMap((h, i) =>
    h.guests.map((g) => ({
      ...g,
      wedding_id: weddingId,
      household_id: created[i].id,
    })),
  );
  if (guestRows.length > 0) unwrap(await db.from("guests").insert(guestRows));
  return { households: created.length, guests: guestRows.length };
}
