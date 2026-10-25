import { unwrap, type Db, type Tables } from "@/lib/db/shared";

// Guests RSVP from a public page (the QR code on the invitation) without an account,
// so these run with the admin client: everything is scoped to one wedding and one invitation.

type Guest = Tables<"guests">;

export type RsvpGuest = Pick<
  Guest,
  "id" | "first_name" | "last_name" | "rsvp" | "meal_choice" | "is_child"
>;

export type RsvpInvitation = {
  householdId: string;
  householdName: string;
  guests: RsvpGuest[];
};

export type RsvpAnswer = {
  guestId: string;
  rsvp: "attending" | "declined";
  mealChoice: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The link printed on invitations as a QR code. */
export function rsvpUrl(origin: string, weddingId: string): string {
  return `${origin.replace(/\/$/, "")}/rsvp/${weddingId}`;
}

/** Lowercase, no accents, no punctuation or extra spaces: "  José O'Neil " → "jose oneil". */
export function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Guests whose name matches what someone typed. The first name must match; the last name too
 * when the guest has one on the list.
 */
export function matchGuests<G extends Pick<Guest, "first_name" | "last_name">>(
  guests: G[],
  firstName: string,
  lastName: string,
): G[] {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  if (!first) return [];
  return guests.filter(
    (g) =>
      normalizeName(g.first_name) === first &&
      (!g.last_name || normalizeName(g.last_name) === last),
  );
}

/** Names on the invitation page, or null when the link doesn't point at a wedding. */
export async function getRsvpWedding(
  db: Db,
  weddingId: string,
): Promise<Pick<
  Tables<"weddings">,
  "id" | "partner1_name" | "partner2_name" | "wedding_date"
> | null> {
  if (!UUID.test(weddingId)) return null;
  return unwrap(
    await db
      .from("weddings")
      .select("id, partner1_name, partner2_name, wedding_date")
      .eq("id", weddingId)
      .maybeSingle(),
  );
}

export type FindInvitationResult =
  | { status: "found"; invitation: RsvpInvitation }
  | { status: "not-found" | "ambiguous" };

/** Finds the invitation (household) of the guest with this name. */
export async function findInvitation(
  db: Db,
  weddingId: string,
  firstName: string,
  lastName: string,
): Promise<FindInvitationResult> {
  if (!UUID.test(weddingId)) return { status: "not-found" };
  const guests = unwrap(
    await db
      .from("guests")
      .select("household_id, first_name, last_name")
      .eq("wedding_id", weddingId),
  );
  const households = new Set(
    matchGuests(guests, firstName, lastName).map((g) => g.household_id),
  );
  if (households.size === 0) return { status: "not-found" };
  if (households.size > 1) return { status: "ambiguous" };

  const [householdId] = [...households];
  const household = unwrap<{ id: string; name: string; guests: RsvpGuest[] }>(
    await db
      .from("households")
      .select(
        "id, name, guests(id, first_name, last_name, rsvp, meal_choice, is_child)",
      )
      .eq("id", householdId)
      .eq("wedding_id", weddingId)
      .order("created_at", { referencedTable: "guests" })
      .single(),
  );
  return {
    status: "found",
    invitation: {
      householdId: household.id,
      householdName: household.name,
      guests: household.guests,
    },
  };
}

/** Saves the answers for guests on this invitation; answers for anyone else are ignored. */
export async function saveRsvp(
  db: Db,
  weddingId: string,
  invitation: RsvpInvitation,
  answers: RsvpAnswer[],
): Promise<void> {
  const ids = new Set(invitation.guests.map((g) => g.id));
  for (const a of answers.filter((a) => ids.has(a.guestId))) {
    unwrap(
      await db
        .from("guests")
        .update({
          rsvp: a.rsvp,
          meal_choice: a.rsvp === "attending" ? a.mealChoice : null,
        })
        .eq("id", a.guestId)
        .eq("household_id", invitation.householdId)
        .eq("wedding_id", weddingId),
    );
  }
}
