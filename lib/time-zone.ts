/**
 * The viewer's time zone. The server runs in UTC, so anything it renders about "today" or an
 * event's time must be worked out in the viewer's zone, not the server's. The browser stores
 * its zone in the `tz` cookie (components/time-zone-sync.tsx); the server reads it with
 * `viewerTimeZone()` in lib/time-zone-server.ts. Until the cookie exists, UTC is used.
 */

export const TIME_ZONE_COOKIE = "tz";
export const DEFAULT_TIME_ZONE = "UTC";

/** `tz` if it's a time zone this runtime knows (e.g. "America/Denver"), else undefined. */
export function validTimeZone(
  tz: string | null | undefined,
): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

/** The calendar day (`YYYY-MM-DD`) of an instant, in `timeZone`. */
export function dateInZone(instant: string | Date, timeZone: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}

/** Today as `YYYY-MM-DD` in `timeZone`. */
export const todayIn = (timeZone: string, now: Date = new Date()) =>
  dateInZone(now, timeZone);

/** "2:00 PM", or "2p" / "2:30p" when `short` (month-grid chips). */
export function formatTimeInZone(
  iso: string,
  timeZone: string,
  { short = false }: { short?: boolean } = {},
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  if (!short) return `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
  const minute = get("minute");
  return `${get("hour")}${minute === "00" ? "" : `:${minute}`}${get("dayPeriod").startsWith("A") ? "a" : "p"}`;
}

/** "Nov 27, 2026, 2:00 PM" in `timeZone`. */
export function formatDateTimeInZone(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
