import type { HouseholdWithGuests } from "@/lib/db/guests";
import type { Enums, NewRow } from "@/lib/db/shared";

// Guest CSV import (parse -> map columns -> group into households -> preview -> importGuests)
// and export. Pure functions: safe to use in Client Components.

export type ImportedGuest = Omit<NewRow<"guests">, "household_id">;
export type ImportedHousehold = NewRow<"households"> & {
  guests: ImportedGuest[];
};

export const GUEST_FIELDS = {
  full_name: "Full name",
  first_name: "First name",
  last_name: "Last name",
  household_name: "Household / envelope name",
  email: "Email",
  phone: "Phone",
  address_line1: "Address",
  address_line2: "Address line 2",
  city: "City",
  region: "State / region",
  postal_code: "ZIP / postal code",
  country: "Country",
  side: "Side",
  rsvp: "RSVP",
  meal_choice: "Meal",
  is_child: "Child?",
  plus_one_allowed: "Plus-one?",
  notes: "Notes",
} as const;

export type GuestField = keyof typeof GUEST_FIELDS;
/** Column index in the CSV -> which field it holds (null = ignore the column). */
export type ColumnMapping = (GuestField | null)[];

const ALIASES: Record<GuestField, string[]> = {
  full_name: ["name", "full name", "guest", "guest name"],
  first_name: ["first", "first name", "firstname", "given name"],
  last_name: ["last", "last name", "lastname", "surname", "family name"],
  household_name: [
    "household",
    "household name",
    "envelope",
    "envelope name",
    "addressee",
    "family",
  ],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "phone number", "mobile", "cell"],
  address_line1: [
    "address",
    "street",
    "address 1",
    "address line 1",
    "street address",
    "mailing address",
  ],
  address_line2: [
    "address 2",
    "address line 2",
    "apt",
    "apartment",
    "unit",
    "suite",
  ],
  city: ["city", "town"],
  region: ["state", "region", "province", "st"],
  postal_code: ["zip", "zip code", "zipcode", "postal code", "postcode"],
  country: ["country"],
  side: ["side", "bride or groom", "whose side"],
  rsvp: ["rsvp", "attending", "response", "status"],
  meal_choice: ["meal", "meal choice", "entree", "dinner", "food"],
  is_child: ["child", "is child", "kid", "under 18"],
  plus_one_allowed: ["plus one", "plus-one", "+1", "guest allowed"],
  notes: ["notes", "note", "comments"],
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_?:#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const matchKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const isBlankRow = (row: string[]) => row.every((cell) => cell.trim() === "");

/** Parses CSV text (quoted fields, embedded commas/newlines, CRLF, BOM). Drops trailing blank lines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);
  while (rows.length > 0 && isBlankRow(rows[rows.length - 1])) rows.pop();
  return rows;
}

/** Best guess at what each header means; the UI should let people correct it. */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const used = new Set<GuestField>();
  return headers.map((header) => {
    const h = normalize(header);
    const match = (Object.keys(ALIASES) as GuestField[]).find(
      (field) =>
        !used.has(field) &&
        (ALIASES[field].includes(h) || normalize(field) === h),
    );
    if (match) used.add(match);
    return match ?? null;
  });
}

const TRUTHY = new Set(["y", "yes", "true", "1", "x", "✓"]);
const parseBool = (v: string) => TRUTHY.has(v.trim().toLowerCase());

function parseRsvp(v: string): Enums<"rsvp_status"> {
  const s = v.trim().toLowerCase();
  if (
    ["yes", "y", "attending", "accepted", "accept", "coming", "true"].includes(
      s,
    )
  )
    return "attending";
  if (
    [
      "no",
      "n",
      "declined",
      "decline",
      "regrets",
      "not coming",
      "false",
    ].includes(s)
  )
    return "declined";
  return "pending";
}

function parseSide(v: string): Enums<"guest_side"> {
  const s = v.trim().toLowerCase();
  if (["1", "partner1", "partner 1", "p1"].includes(s)) return "partner1";
  if (["2", "partner2", "partner 2", "p2"].includes(s)) return "partner2";
  return "both";
}

const blankToNull = (v: string | undefined) =>
  v && v.trim() !== "" ? v.trim() : null;

function joinNames(names: string[]): string {
  if (names.length <= 2) return names.join(" & ");
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Envelope name: "Ann & Bob Smith" when they share a last name, else "Ann Smith & Bob Jones". */
export function envelopeName(
  guests: Pick<ImportedGuest, "first_name" | "last_name">[],
): string {
  const lastNames = new Set(guests.map((g) => g.last_name ?? ""));
  if (lastNames.size === 1) {
    const last = [...lastNames][0];
    return `${joinNames(guests.map((g) => g.first_name))}${last ? ` ${last}` : ""}`;
  }
  return joinNames(
    guests.map((g) => [g.first_name, g.last_name].filter(Boolean).join(" ")),
  );
}

export type ImportPreview = {
  households: ImportedHousehold[];
  /** Rows that couldn't be imported, with 1-based row numbers counting the header. */
  skipped: { row: number; reason: string }[];
};

/**
 * Turns CSV rows (without the header) into households. Guests are grouped by the household
 * column if there is one, otherwise by street address + ZIP; guests with neither get their own.
 */
export function buildImportPreview(
  rows: string[][],
  mapping: ColumnMapping,
): ImportPreview {
  const groups = new Map<
    string,
    { household: ImportedHousehold; explicitName: boolean }
  >();
  const skipped: ImportPreview["skipped"] = [];

  rows.forEach((cells, i) => {
    if (isBlankRow(cells)) return;
    const get = (field: GuestField) => {
      const idx = mapping.indexOf(field);
      return idx === -1 ? "" : (cells[idx] ?? "").trim();
    };

    let first = get("first_name");
    let last = get("last_name");
    if (!first && get("full_name")) {
      const parts = get("full_name").split(/\s+/);
      first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
      last = last || (parts.length > 1 ? parts[parts.length - 1] : "");
    }
    if (!first) {
      skipped.push({ row: i + 2, reason: "No name" });
      return;
    }

    const guest: ImportedGuest = {
      first_name: first,
      last_name: blankToNull(last),
      email: blankToNull(get("email")),
      phone: blankToNull(get("phone")),
      rsvp: parseRsvp(get("rsvp")),
      meal_choice: blankToNull(get("meal_choice")),
      is_child: parseBool(get("is_child")),
      plus_one_allowed: parseBool(get("plus_one_allowed")),
      notes: blankToNull(get("notes")),
    };

    const householdName = get("household_name");
    const street = matchKey(get("address_line1"));
    const key = householdName
      ? `name:${matchKey(householdName)}`
      : street
        ? `addr:${street}|${matchKey(get("postal_code") || get("city"))}`
        : `row:${i}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        explicitName: Boolean(householdName),
        household: {
          name: householdName,
          address_line1: blankToNull(get("address_line1")),
          address_line2: blankToNull(get("address_line2")),
          city: blankToNull(get("city")),
          region: blankToNull(get("region")),
          postal_code: blankToNull(get("postal_code")),
          country: blankToNull(get("country")),
          side: parseSide(get("side")),
          guests: [],
        },
      };
      groups.set(key, group);
    }
    group.household.guests.push(guest);
  });

  const households = [...groups.values()].map(({ household, explicitName }) =>
    explicitName
      ? household
      : { ...household, name: envelopeName(household.guests) },
  );
  return { households, skipped };
}

/** One call for the common case: parse, guess the mapping, and build the preview. */
export function parseGuestCsv(text: string, mapping?: ColumnMapping) {
  const [headers = [], ...rows] = parseCsv(text);
  const columns = mapping ?? guessColumnMapping(headers);
  return { headers, mapping: columns, ...buildImportPreview(rows, columns) };
}

// export ---------------------------------------------------------------------

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/**
 * `households`: one row per envelope (mail merge). `guests`: one row per person.
 * Pass `attendingOnly` to leave out declined guests.
 */
export function guestListToCsv(
  households: HouseholdWithGuests[],
  mode: "households" | "guests" = "households",
  { attendingOnly = false } = {},
): string {
  const address = (h: HouseholdWithGuests) => [
    h.address_line1,
    h.address_line2,
    h.city,
    h.region,
    h.postal_code,
    h.country,
  ];
  const addressHeaders = [
    "Address",
    "Address line 2",
    "City",
    "State",
    "ZIP",
    "Country",
  ];
  const keep = (g: HouseholdWithGuests["guests"][number]) =>
    !attendingOnly || g.rsvp !== "declined";

  if (mode === "households") {
    return toCsv([
      ["Envelope name", ...addressHeaders, "Guests", "Guest count", "Side"],
      ...households
        .filter((h) => h.guests.some(keep))
        .map((h) => {
          const guests = h.guests.filter(keep);
          return [
            h.name,
            ...address(h),
            guests
              .map((g) => [g.first_name, g.last_name].filter(Boolean).join(" "))
              .join("; "),
            guests.length,
            h.side,
          ];
        }),
    ]);
  }
  return toCsv([
    [
      "First name",
      "Last name",
      "Household",
      "Email",
      "Phone",
      "RSVP",
      "Meal",
      "Child",
      "Plus-one",
      ...addressHeaders,
      "Side",
    ],
    ...households.flatMap((h) =>
      h.guests
        .filter(keep)
        .map((g) => [
          g.first_name,
          g.last_name,
          h.name,
          g.email,
          g.phone,
          g.rsvp,
          g.meal_choice,
          g.is_child ? "yes" : "no",
          g.plus_one_allowed ? "yes" : "no",
          ...address(h),
          h.side,
        ]),
    ),
  ]);
}
