import { describe, expect, it } from "vitest";
import {
  familyName,
  familyPeople,
  isPlaceholderGuest,
  listFirstNames,
  MAX_FAMILY_SIZE,
  placeholderName,
  replyCount,
} from "@/lib/db/household-form";

const p = (first_name: string, last_name: string | null = null) => ({
  first_name,
  last_name,
});

describe("familyName", () => {
  it("is 'The X family' when everyone shares a last name", () => {
    expect(familyName([p("Maria", "Lopez"), p("Daniel", " Lopez ")])).toBe(
      "The Lopez family",
    );
  });
  it("falls back to the envelope name when last names differ or are missing", () => {
    expect(familyName([p("Maria", "Lopez"), p("Sam", "Chen")])).toBe(
      "Maria Lopez & Sam Chen",
    );
    expect(familyName([p("Maria"), p("Sam")])).toBe("Maria & Sam");
  });
});

describe("familyPeople", () => {
  it("keeps rows with a first name and requires the first", () => {
    expect(
      familyPeople({
        mode: "names",
        rows: [p("Maria", "Lopez"), p("  ", "Lopez"), p("Sofia", "Lopez")],
      }),
    ).toEqual({ people: [p("Maria", "Lopez"), p("Sofia", "Lopez")] });
    expect(
      familyPeople({ mode: "names", rows: [p("", "Lopez"), p("Daniel")] }),
    ).toEqual({ error: "Add the first person's first name." });
  });

  it("adds stand-ins named after the first person's last name", () => {
    expect(
      familyPeople({ mode: "count", first: p("Maria", "Lopez"), others: 2 }),
    ).toEqual({
      people: [p("Maria", "Lopez"), p("Lopez guest 2"), p("Lopez guest 3")],
    });
    expect(
      familyPeople({ mode: "count", first: p("Maria"), others: 1 }),
    ).toEqual({ people: [p("Maria"), p("Guest 2")] });
  });

  it("refuses a count below one or a family that's too big", () => {
    expect(
      familyPeople({ mode: "count", first: p("Maria"), others: 0 }),
    ).toHaveProperty("error");
    expect(
      familyPeople({
        mode: "count",
        first: p("Maria"),
        others: MAX_FAMILY_SIZE,
      }),
    ).toHaveProperty("error");
  });
});

describe("placeholders", () => {
  it("recognises the stand-ins it makes, and not real people", () => {
    expect(isPlaceholderGuest(p(placeholderName("Lopez", 2)))).toBe(true);
    expect(isPlaceholderGuest(p(placeholderName(null, 3)))).toBe(true);
    expect(isPlaceholderGuest(p("Maria", "Lopez"))).toBe(false);
    expect(isPlaceholderGuest(p("Lopez guest 2", "Lopez"))).toBe(false);
  });
});

describe("listFirstNames and replyCount", () => {
  it("joins names for the preview", () => {
    expect(listFirstNames(["Maria"])).toBe("Maria");
    expect(listFirstNames(["Maria", "Daniel", "Sofia"])).toBe(
      "Maria, Daniel and Sofia",
    );
  });
  it("counts coming and not coming as replied", () => {
    expect(
      replyCount([
        { rsvp: "attending" },
        { rsvp: "declined" },
        { rsvp: "pending" },
      ]),
    ).toEqual({ replied: 2, total: 3 });
  });
});
