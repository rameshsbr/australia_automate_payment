// lib/rate-limit.ts
type Key = string;

type Bucket = {
  ts: number[];            // request timestamps (ms)
  limit: number;
  windowMs: number;
};

const store = new Map<Key, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(key: Key, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key) ?? { ts: [], limit, windowMs };
  // prune old
  bucket.ts = bucket.ts.filter((t) => now - t < windowMs);
  if (bucket.ts.length >= limit) {
    const oldest = bucket.ts[0];
    const retryAfterSec = Math.ceil((bucket.windowMs - (now - oldest)) / 1000);
    store.set(key, bucket);
    return { ok: false, retryAfterSec };
  }
  bucket.ts.push(now);
  store.set(key, bucket);
  return { ok: true };
}

/** Convenience: build a key per IP + route */
export function keyFor(ip: string | undefined, route: string): Key {
  return `${ip ?? "unknown"}:${route}`;
}
