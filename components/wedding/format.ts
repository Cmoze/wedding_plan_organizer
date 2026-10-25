const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatMoney = (n: number | null | undefined) =>
  usd.format(Number(n ?? 0));

/** Parses `YYYY-MM-DD` as a local date (new Date("2027-03-01") would be UTC and can show the day before). */
export function parseDate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const formatDate = (date: string | null | undefined) =>
  date
    ? parseDate(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export const monthLabel = (date: string) =>
  parseDate(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

export const weddingTitle = (w: {
  partner1_name: string;
  partner2_name: string | null;
}) =>
  w.partner2_name ? `${w.partner1_name} & ${w.partner2_name}` : w.partner1_name;

export const weddingHeading = (w: {
  partner1_name: string;
  partner2_name: string | null;
}) =>
  w.partner2_name
    ? `${w.partner1_name} and ${w.partner2_name}’s Wedding`
    : `${w.partner1_name}’s Wedding`;

/** Turns what someone typed ("zola.com/registry/us") into a safe http(s) link, or null if it isn't one. */
export function webLink(input: string): string | null {
  const value = input.trim();
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value)
    ? value
    : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
