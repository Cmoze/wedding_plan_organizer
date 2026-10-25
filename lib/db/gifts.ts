import { unwrap, type Db, type Tables } from "@/lib/db/shared";

/**
 * A gift someone gave the couple, and whether their thank-you card has gone out.
 * `household_id` is who it's from when they're on the guest list (the card goes to that address);
 * `giver_name` is the household name in that case. `received_on` is `YYYY-MM-DD`.
 */
export type Gift = Tables<"gifts">;

export type NewGift = Pick<Gift, "giver_name" | "description"> &
  Partial<
    Pick<Gift, "household_id" | "registry_link_id" | "received_on" | "notes">
  >;

/** Newest first. */
export async function getGifts(db: Db, weddingId: string): Promise<Gift[]> {
  return unwrap(
    await db
      .from("gifts")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("received_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  );
}

export async function createGift(
  db: Db,
  weddingId: string,
  input: NewGift,
): Promise<Gift> {
  return unwrap(
    await db
      .from("gifts")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

/** Marks every gift in `giftIds` as thanked (or not), so one card can cover several gifts. */
export async function setThankYouSent(
  db: Db,
  giftIds: string[],
  sent: boolean,
): Promise<void> {
  unwrap(
    await db
      .from("gifts")
      .update({ thank_you_sent_at: sent ? new Date().toISOString() : null })
      .in("id", giftIds),
  );
}

export async function deleteGift(db: Db, giftId: string): Promise<void> {
  unwrap(await db.from("gifts").delete().eq("id", giftId));
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
