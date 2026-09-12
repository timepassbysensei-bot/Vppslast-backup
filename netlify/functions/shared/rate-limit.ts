import type { HandlerEvent } from "@netlify/functions";

// Best-effort in-memory per-IP rate limiter. NOTE: serverless instances are
// ephemeral and not shared, so this is a soft safeguard, not a hard guarantee.
// For strict limits, back this with a durable store (e.g. Upstash/Redis).

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(event: HandlerEvent): string {
  // Netlify sets x-nf-client-connection-ip; fall back to the FIRST hop of
  // x-forwarded-for (never trust the whole header blindly).
  const nf = event.headers["x-nf-client-connection-ip"];
  if (nf) return nf.trim();
  const xff = event.headers["x-forwarded-for"];
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

// Opportunistically drop stale buckets so the map cannot grow unbounded.
export function sweep(): void {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}
