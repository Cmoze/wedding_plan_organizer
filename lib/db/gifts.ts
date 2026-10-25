import { DbError, unwrap, type Db, type Tables } from "@/lib/db/shared";

// TODO(B): the `gifts` table doesn't exist yet (proposal in docs/PLAN.md, Role B). These run the real
// queries through an untyped client: until the migration lands, reads return nothing and writes fail
// with a friendly message. After `npm run db:types`, replace `Gift` with `Tables<"gifts">` and drop `gifts()`.

/** A gift someone gave the couple, and whether their thank-you card has gone out. */
export type Gift = {
  id: string;
  wedding_id: string;
  /** Who it's from, when they're on the guest list; the card goes to this address. */
  household_id: string | null;
  /** Shown on the card list; the household name when it came from the guest list. */
  giver_name: string;
  description: string;
  /** Which registry it was bought from, if any. */
  registry_link_id: string | null;
  /** `YYYY-MM-DD` */
  received_on: string | null;
  thank_you_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewGift = Pick<Gift, "giver_name" | "description"> &
  Partial<
    Pick<Gift, "household_id" | "registry_link_id" | "received_on" | "notes">
  >;

const NOT_SET_UP = "Gift tracking isn't switched on yet. Ask Caleb to add it.";

const isMissingTable = (e: unknown) =>
  e instanceof DbError && (e.code === "PGRST205" || e.code === "42P01");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gifts = (db: Db) => (db as any).from("gifts");

async function write<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    throw isMissingTable(e) ? new DbError(NOT_SET_UP) : e;
  }
}

/** Newest first. Empty until the gifts table exists. */
export async function getGifts(db: Db, weddingId: string): Promise<Gift[]> {
  try {
    return unwrap<Gift[]>(
      await gifts(db)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("received_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    );
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw e;
  }
}

export function createGift(
  db: Db,
  weddingId: string,
  input: NewGift,
): Promise<Gift> {
  return write(async () =>
    unwrap<Gift>(
      await gifts(db)
        .insert({ ...input, wedding_id: weddingId })
        .select()
        .single(),
    ),
  );
}

/** Marks every gift in `giftIds` as thanked (or not), so one card can cover several gifts. */
export function setThankYouSent(
  db: Db,
  giftIds: string[],
  sent: boolean,
): Promise<void> {
  return write(async () => {
    unwrap(
      await gifts(db)
        .update({ thank_you_sent_at: sent ? new Date().toISOString() : null })
        .in("id", giftIds),
    );
  });
}

export function deleteGift(db: Db, giftId: string): Promise<void> {
  return write(async () => {
    unwrap(await gifts(db).delete().eq("id", giftId));
  });
}

type Household = Pick<
  Tables<"households">,
  | "id"
  | "name"
  | "address_line1"
  | "address_line2"
  | "city"
  | "region"
  | "postal_code"
  | "country"
>;

/** One thank-you card: everything a household (or someone not on the list) gave. */
export type ThankYouCard = {
  key: string;
  name: string;
  household: Household | null;
  gifts: Gift[];
  sent: boolean;
};

/**
 * Groups gifts into one card per household, or per giver name for people not on the guest list.
 * A card counts as sent only when every gift on it has been thanked. Cards still to send come first.
 */
export function thankYouCards(
  gifts: Gift[],
  households: Household[],
): ThankYouCard[] {
  const byId = new Map(households.map((h) => [h.id, h]));
  const cards = new Map<string, ThankYouCard>();
  for (const gift of gifts) {
    const household = gift.household_id
      ? (byId.get(gift.household_id) ?? null)
      : null;
    const key = household
      ? `h:${household.id}`
      : `n:${gift.giver_name.trim().toLowerCase()}`;
    const card = cards.get(key) ?? {
      key,
      name: household?.name ?? gift.giver_name,
      household,
      gifts: [],
      sent: true,
    };
    card.gifts.push(gift);
    card.sent &&= gift.thank_you_sent_at !== null;
    cards.set(key, card);
  }
  return [...cards.values()].sort(
    (a, b) => Number(a.sent) - Number(b.sent) || a.name.localeCompare(b.name),
  );
}

/** The mailing address as lines for an envelope, or [] if there isn't one. */
export function envelopeAddress(h: Household | null): string[] {
  if (!h?.address_line1) return [];
  const cityLine = [
    [h.city, h.region].filter(Boolean).join(", "),
    h.postal_code,
  ]
    .filter(Boolean)
    .join(" ");
  return [h.address_line1, h.address_line2, cityLine, h.country].filter(
    (line): line is string => Boolean(line),
  );
}
