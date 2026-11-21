import { describe, expect, it } from "vitest";
import {
  dateInZone,
  formatDateTimeInZone,
  formatTimeInZone,
  todayIn,
  validTimeZone,
} from "@/lib/time-zone";

// The demo cake tasting: 2:00 PM in Denver (MST, UTC-7) is 21:00 UTC.
const CAKE = "2026-11-27T21:00:00+00:00";
// A 6:30 PM Denver rehearsal dinner is the next day in UTC.
const DINNER = "2027-06-19T00:30:00Z";

describe("time zone helpers", () => {
  it("formats times in the viewer's zone, not UTC", () => {
    expect(formatTimeInZone(CAKE, "America/Denver")).toBe("2:00 PM");
    expect(formatTimeInZone(CAKE, "UTC")).toBe("9:00 PM");
    expect(formatTimeInZone(CAKE, "America/Denver", { short: true })).toBe(
      "2p",
    );
    expect(formatTimeInZone(DINNER, "America/Denver", { short: true })).toBe(
      "6:30p",
    );
    expect(
      formatTimeInZone("2026-11-27T16:05:00Z", "UTC", { short: true }),
    ).toBe("4:05p");
    expect(
      formatTimeInZone("2026-11-27T09:00:00Z", "UTC", { short: true }),
    ).toBe("9a");
  });

  it("puts an evening event on its local day", () => {
    expect(dateInZone(DINNER, "America/Denver")).toBe("2027-06-18");
    expect(dateInZone(DINNER, "UTC")).toBe("2027-06-19");
  });

  it("works out today in the viewer's zone", () => {
    const evening = new Date("2026-11-21T03:00:00Z"); // 8 PM Nov 20 in Denver
    expect(todayIn("America/Denver", evening)).toBe("2026-11-20");
    expect(todayIn("UTC", evening)).toBe("2026-11-21");
  });

  it("formats a date and time for the inbox", () => {
    expect(formatDateTimeInZone(CAKE, "America/Denver")).toBe(
      "Nov 27, 2026, 2:00 PM",
    );
  });

  it("rejects unknown zones", () => {
    expect(validTimeZone("America/Denver")).toBe("America/Denver");
    expect(validTimeZone("Not/AZone")).toBeUndefined();
    expect(validTimeZone("")).toBeUndefined();
    expect(validTimeZone(undefined)).toBeUndefined();
  });
});
