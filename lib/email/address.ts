/** Splits `"Jane Doe" <jane@example.com>` (or a bare address) into name and address. */
export function parseAddress(value: string): {
  name: string | null;
  address: string;
} {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) return { name: null, address: value.trim().toLowerCase() };
  const name = match[1].replace(/^"(.*)"$/, "$1").trim();
  return { name: name || null, address: match[2].trim().toLowerCase() };
}

/**
 * Finds the wedding inbox among the recipients: the first `<slug>@<inboundDomain>` address.
 * Returns the slug and the full address, or null if no recipient is on our domain.
 */
export function findInboxAddress(
  recipients: string[],
  inboundDomain: string,
): { slug: string; address: string } | null {
  const domain = inboundDomain.trim().toLowerCase();
  for (const recipient of recipients) {
    const { address } = parseAddress(recipient);
    const at = address.lastIndexOf("@");
    if (at <= 0 || address.slice(at + 1) !== domain) continue;
    // Drop "+tag" so smith-jones+venue@... still reaches smith-jones.
    const slug = address.slice(0, at).split("+")[0];
    if (slug) return { slug, address };
  }
  return null;
}
