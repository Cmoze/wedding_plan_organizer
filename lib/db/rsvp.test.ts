import { describe, expect, it } from "vitest";
import { matchGuests, normalizeName, rsvpUrl } from "@/lib/db/rsvp";

describe("normalizeName", () => {
  it("ignores case, accents, punctuation and spacing", () => {
    expect(normalizeName("  José  O'Neil ")).toBe("jose oneil");
    expect(normalizeName(null)).toBe("");
  });
});

describe("matchGuests", () => {
  const guests = [
    { first_name: "Maya", last_name: "Lopez" },
    { first_name: "Maya", last_name: "Chen" },
    { first_name: "Sam", last_name: null },
  ];

  it("matches first and last name loosely", () => {
    expect(matchGuests(guests, "maya", "LOPEZ")).toEqual([guests[0]]);
  });

  it("needs the last name when the guest has one", () => {
    expect(matchGuests(guests, "Maya", "")).toEqual([]);
  });

  it("matches on first name alone when the list has no last name", () => {
    expect(matchGuests(guests, "Sam", "Whoever")).toEqual([guests[2]]);
  });

  it("finds nothing for an empty first name", () => {
    expect(matchGuests(guests, " ", "Lopez")).toEqual([]);
  });
});

describe("rsvpUrl", () => {
  it("joins the origin and wedding id", () => {
    expect(rsvpUrl("https://x.app/", "abc")).toBe("https://x.app/rsvp/abc");
  });
});
