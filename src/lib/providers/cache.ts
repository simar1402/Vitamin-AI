/**
 * In-memory session cache for the feed API.
 *
 * Key:   SHA-like string from sorted industries + sorted contentTypes
 * Value: { items, fetchedAt }
 *
 * TTL: 30 minutes — after which the cache entry is stale and the
 *      next request triggers a fresh fetch.
 *
 * Cache is scoped to the Node.js process lifetime (i.e. the dev server
 * session or a single serverless invocation warm pool). It is NOT
 * persisted to disk or Redis, keeping the architecture dependency-free.
 *
 * Per the product spec:
 *  - Fresh content is only fetched when the user explicitly triggers it
 *    (Refresh button or browser reload). The cache prevents redundant
 *    re-fetches within the same session.
 */

import type { FeedItem, ContentType } from "./types";

interface CacheEntry {
  items: FeedItem[];
  fetchedAt: number; // Date.now()
}

// Module-level singleton — survives across requests in a warm server instance.
const store = new Map<string, CacheEntry>();

const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours within a calendar day

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeKey(industries: string[], contentTypes: ContentType[]): string {
  const i = [...industries].sort().join("|");
  const c = [...contentTypes].sort().join("|");
  // Include date so each new day triggers a fresh fetch (daily new content)
  return `v7::${todayUtc()}::${i}::${c}`;
}

export function getCached(
  industries: string[],
  contentTypes: ContentType[],
): FeedItem[] | null {
  const key = makeKey(industries, contentTypes);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.items;
}

export function setCached(
  industries: string[],
  contentTypes: ContentType[],
  items: FeedItem[],
): void {
  const key = makeKey(industries, contentTypes);
  store.set(key, { items, fetchedAt: Date.now() });

  // Evict oldest entries if store grows beyond 50 keys
  if (store.size > 50) {
    const oldest = [...store.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)[0];
    if (oldest) store.delete(oldest[0]);
  }
}

/** Force-bust cache for a specific key (called on Refresh) */
export function bustCache(
  industries: string[],
  contentTypes: ContentType[],
): void {
  store.delete(makeKey(industries, contentTypes));
}

export function getCacheStats() {
  return { size: store.size, keys: [...store.keys()] };
}
