import { createHmac, timingSafeEqual } from "node:crypto";

/** Reject webhooks signed more than this long ago (or ahead), to block replays. */
const TOLERANCE_SECONDS = 5 * 60;

export type WebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

/**
 * Checks a Resend webhook signature (Resend signs with Svix): HMAC-SHA256 over
 * `<svix-id>.<svix-timestamp>.<raw body>`, keyed with the base64 part of the `whsec_...` secret.
 * The `svix-signature` header holds one or more space-separated `v1,<base64>` signatures.
 */
export function verifyWebhook(
  secret: string,
  headers: WebhookHeaders,
  rawBody: string,
  now: Date = new Date(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(now.getTime() / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
