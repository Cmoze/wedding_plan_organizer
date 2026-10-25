import { describe, expect, it } from "vitest";
import { envelopeAddress, thankYouCards, type Gift } from "@/lib/db/gifts";

const household = (id: string, name: string) => ({
  id,
  name,
  address_line1: "12 Oak St",
  address_line2: null,
  city: "Portland",
  region: "OR",
  postal_code: "97201",
  country: null,
});

const gift = (overrides: Partial<Gift>): Gift => ({
  id: crypto.randomUUID(),
  wedding_id: "w",
  household_id: null,
  giver_name: "Someone",
  description: "Gift",
  registry_link_id: null,
  received_on: null,
  thank_you_sent_at: null,
  notes: null,
  created_at: "",
  updated_at: "",
  ...overrides,
});

describe("thankYouCards", () => {
  it("puts a household's gifts on one card, with cards to send first", () => {
    const cards = thankYouCards(
      [
        gift({ household_id: "a", description: "Mixer" }),
        gift({ giver_name: "Aunt Rose", thank_you_sent_at: "2026-10-01" }),
        gift({ household_id: "a", description: "Towels" }),
        gift({ giver_name: "aunt rose ", thank_you_sent_at: "2026-10-02" }),
      ],
      [household("a", "The Lopez Family")],
    );
    expect(cards.map((c) => [c.name, c.gifts.length, c.sent])).toEqual([
      ["The Lopez Family", 2, false],
      ["Aunt Rose", 2, true],
    ]);
  });

  it("needs a new card when a thanked household sends another gift", () => {
    const [card] = thankYouCards(
      [
        gift({ household_id: "a", thank_you_sent_at: "2026-10-01" }),
        gift({ household_id: "a" }),
      ],
      [household("a", "The Lopez Family")],
    );
    expect(card.sent).toBe(false);
  });
});

describe("envelopeAddress", () => {
  it("formats the address lines and skips empty ones", () => {
    expect(envelopeAddress(household("a", "x"))).toEqual([
      "12 Oak St",
      "Portland, OR 97201",
    ]);
    expect(envelopeAddress(null)).toEqual([]);
  });
});
