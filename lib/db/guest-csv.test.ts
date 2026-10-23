import { describe, expect, it } from "vitest";
import {
  envelopeName,
  guessColumnMapping,
  guestListToCsv,
  parseCsv,
  parseGuestCsv,
} from "@/lib/db/guest-csv";
import type { HouseholdWithGuests } from "@/lib/db/guests";

describe("parseCsv", () => {
  it("handles quotes, embedded commas and newlines, CRLF and a BOM", () => {
    const text =
      '\uFEFFname,notes\r\n"Smith, Ann","says ""hi""\ntwice"\r\nBob,\r\n\r\n';
    expect(parseCsv(text)).toEqual([
      ["name", "notes"],
      ["Smith, Ann", 'says "hi"\ntwice'],
      ["Bob", ""],
    ]);
  });
});

describe("guessColumnMapping", () => {
  it("recognizes common spreadsheet headers and ignores unknown ones", () => {
    expect(
      guessColumnMapping([
        "First Name",
        "Surname",
        "Street Address",
        "ZIP",
        "Favorite color",
      ]),
    ).toEqual([
      "first_name",
      "last_name",
      "address_line1",
      "postal_code",
      null,
    ]);
  });
});

describe("parseGuestCsv", () => {
  it("groups guests at the same address into one household with an envelope name", () => {
    const csv = [
      "First,Last,Address,City,State,Zip,RSVP,Kid",
      "Ann,Smith,12 Oak St,Austin,TX,78701,yes,",
      "Bob,Smith,12 oak st.,Austin,TX,78701,,",
      "Cy,Smith,12 Oak St,Austin,TX,78701,no,x",
      "Dee,Jones,,,,,,",
      ",,,,,,,",
      ",Nameless,9 Elm,Austin,TX,78702,,",
    ].join("\n");

    const preview = parseGuestCsv(csv);

    expect(preview.households).toHaveLength(2);
    const [smiths, jones] = preview.households;
    expect(smiths.name).toBe("Ann, Bob & Cy Smith");
    expect(smiths.city).toBe("Austin");
    expect(
      smiths.guests.map((g) => [g.first_name, g.rsvp, g.is_child]),
    ).toEqual([
      ["Ann", "attending", false],
      ["Bob", "pending", false],
      ["Cy", "declined", true],
    ]);
    expect(jones.name).toBe("Dee Jones");
    expect(jones.address_line1).toBeNull();
    expect(preview.skipped).toEqual([{ row: 7, reason: "No name" }]);
  });

  it("uses an explicit household column and splits full names", () => {
    const csv =
      "Name,Household\nAnn Marie Lee,The Lees\nTom Lee,The Lees\nSolo,";
    const { households } = parseGuestCsv(csv);
    expect(
      households.map((h) => [
        h.name,
        h.guests.map((g) => [g.first_name, g.last_name]),
      ]),
    ).toEqual([
      [
        "The Lees",
        [
          ["Ann Marie", "Lee"],
          ["Tom", "Lee"],
        ],
      ],
      ["Solo", [["Solo", null]]],
    ]);
  });
});

describe("envelopeName", () => {
  it("joins different last names in full", () => {
    expect(
      envelopeName([
        { first_name: "Ann", last_name: "Smith" },
        { first_name: "Bo", last_name: "Jones" },
      ]),
    ).toBe("Ann Smith & Bo Jones");
  });
});

describe("guestListToCsv", () => {
  const household = {
    name: 'Ann "Annie" & Bob Smith',
    address_line1: "12 Oak St, Apt 4",
    city: "Austin",
    region: "TX",
    postal_code: "78701",
    side: "both",
    guests: [
      { first_name: "Ann", last_name: "Smith", rsvp: "attending" },
      { first_name: "Bob", last_name: "Smith", rsvp: "declined" },
    ],
  } as unknown as HouseholdWithGuests;

  it("writes one escaped row per envelope", () => {
    expect(guestListToCsv([household]).split("\r\n")[1]).toBe(
      '"Ann ""Annie"" & Bob Smith","12 Oak St, Apt 4",,Austin,TX,78701,,Ann Smith; Bob Smith,2,both',
    );
  });

  it("can leave out declined guests", () => {
    const rows = guestListToCsv([household], "guests", { attendingOnly: true })
      .trim()
      .split("\r\n");
    expect(rows).toHaveLength(2);
    expect(rows[1].startsWith("Ann,Smith,")).toBe(true);
  });
});
