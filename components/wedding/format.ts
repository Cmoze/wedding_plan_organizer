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
