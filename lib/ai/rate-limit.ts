/**
 * Best-effort in-memory limiter (per server instance). Enough to stop a stuck button from
 * running up the Claude bill during the hackathon; not a security boundary.
 */

const hits = new Map<string, number[]>();

export const AI_RATE_LIMIT = { max: 20, windowMs: 10 * 60_000 };

/** Records a hit for `key` and returns false if it's over the limit. */
export function takeRateLimit(
  key: string,
  now = Date.now(),
  limit = AI_RATE_LIMIT,
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (recent.length >= limit.max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
