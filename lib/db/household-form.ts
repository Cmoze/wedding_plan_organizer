import { envelopeName } from "@/lib/db/guest-csv";
import type { Guest } from "@/lib/db/guests";

// "Add a family or group" on Guests (spec 002 row 8). Pure functions: the form's preview and
// the server action use the same rules, so what the envelope preview says is what gets saved.

export type FamilyPerson = { first_name: string; last_name: string | null };

/** Most people a family or group can add in one go, placeholders included. */
export const MAX_FAMILY_SIZE = 21;

const clean = (s: string | null | undefined) => s?.trim() || null;

/** The last name everyone shares, or null if they differ or none is given. */
export function sharedLastName(people: FamilyPerson[]): string | null {
  const lasts = new Set(people.map((p) => clean(p.last_name)));
  if (lasts.size !== 1) return null;
  return [...lasts][0];
}

/** "The Lopez family" when everyone shares a last name, else the envelope name. */
export function familyName(people: FamilyPerson[]): string {
  if (people.length === 0) return "";
  const last = sharedLastName(people);
  return last ? `The ${last} family` : envelopeName(people);
}

/** Stand-in name for someone whose name isn't known yet: "Lopez guest 2" or "Guest 2". */
export function placeholderName(lastName: string | null, n: number): string {
  const last = clean(lastName);
  return last ? `${last} guest ${n}` : `Guest ${n}`;
}

/** A stand-in made by `placeholderName` (no last name; first name like "Lopez guest 2"). */
export function isPlaceholderGuest(
  g: Pick<Guest, "first_name" | "last_name">,
): boolean {
  return !clean(g.last_name) && /^(\S.* )?guest \d+$/i.test(g.first_name);
}

/**
 * The people to save. `names`: every row with a first name (the first row must have one).
 * `count`: the first person plus `others` stand-ins carrying their last name.
 */
export function familyPeople(
  input:
    | { mode: "names"; rows: FamilyPerson[] }
    | { mode: "count"; first: FamilyPerson; others: number },
): { people: FamilyPerson[] } | { error: string } {
  const first = input.mode === "names" ? input.rows[0] : input.first;
  if (!clean(first?.first_name))
    return { error: "Add the first person's first name." };
  let people: FamilyPerson[];
  if (input.mode === "names") {
    people = input.rows
      .filter((r) => clean(r.first_name))
      .map((r) => ({
        first_name: r.first_name.trim(),
        last_name: clean(r.last_name),
      }));
  } else {
    const others = Math.floor(input.others);
    if (!Number.isFinite(others) || others < 1)
      return { error: "Say how many others are coming." };
    const head = {
      first_name: first.first_name.trim(),
      last_name: clean(first.last_name),
    };
    people = [
      head,
      ...Array.from({ length: others }, (_, i) => ({
        first_name: placeholderName(head.last_name, i + 2),
        last_name: null,
      })),
    ];
  }
  if (people.length > MAX_FAMILY_SIZE)
    return { error: `Add up to ${MAX_FAMILY_SIZE} people at a time.` };
  return { people };
}

/** "Maria", "Maria and Daniel", "Maria, Daniel and Sofia". */
export function listFirstNames(names: string[]): string {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** How many of a household's guests have answered (coming or not coming). */
export function replyCount(guests: Pick<Guest, "rsvp">[]): {
  replied: number;
  total: number;
} {
  return {
    replied: guests.filter((g) => g.rsvp !== "pending").length,
    total: guests.length,
  };
}
