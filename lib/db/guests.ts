import { envelopeName, type ImportedHousehold } from "@/lib/db/guest-csv";
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

/**
 * Adds one person. Without a household `id` they get their own invitation (household) named after them,
 * with the side and mailing address given. Joining a household whose name was made from its guests
 * ("Alex Smith") renames it ("Alex & Sam Smith"); a name someone typed in is kept.
 */
export async function addGuest(
  db: Db,
  weddingId: string,
  guest: Omit<NewRow<"guests">, "household_id">,
  household:
    | { id: string }
    | Partial<
        Pick<
          Household,
          | "side"
          | "address_line1"
          | "address_line2"
          | "city"
          | "region"
          | "postal_code"
          | "country"
        >
      > = {},
): Promise<Guest> {
  let householdId: string;
  if ("id" in household) {
    householdId = household.id;
    const current = unwrap<{
      name: string;
      guests: Pick<Guest, "first_name" | "last_name">[];
    }>(
      await db
        .from("households")
        .select("name, guests(first_name, last_name, created_at)")
        .eq("id", householdId)
        .order("created_at", { referencedTable: "guests" })
        .single(),
    );
    if (current.name === envelopeName(current.guests)) {
      await updateHousehold(db, householdId, {
        name: envelopeName([...current.guests, guest]),
      });
    }
  } else {
    householdId = (
      await createHousehold(db, weddingId, {
        ...household,
        name: envelopeName([guest]),
      })
    ).id;
  }
  return createGuest(db, weddingId, { ...guest, household_id: householdId });
}

/** Removes one person, and their invitation too if nobody else is on it. Renames it like `addGuest`. */
export async function removeGuest(db: Db, guestId: string): Promise<void> {
  const guest = unwrap<{
    households: {
      id: string;
      name: string;
      guests: Pick<Guest, "id" | "first_name" | "last_name">[];
    };
  }>(
    await db
      .from("guests")
      .select("households!inner(id, name, guests(id, first_name, last_name))")
      .eq("id", guestId)
      .order("created_at", { referencedTable: "households.guests" })
      .single(),
  );
  const household = guest.households;
  const others = household.guests.filter((g) => g.id !== guestId);
  if (others.length === 0) return deleteHousehold(db, household.id);
  await deleteGuest(db, guestId);
  if (household.name === envelopeName(household.guests)) {
    await updateHousehold(db, household.id, { name: envelopeName(others) });
  }
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
