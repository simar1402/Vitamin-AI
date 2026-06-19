/**
 * Content Ranker & Quality Filter
 *
 *   1. Quality filtering   — clickbait, off-topic, cross-domain leaks
 *   2. Deduplication       — by URL and normalised title
 *   3. Field relevance     — profession × AI (all content types)
 *   4. Ranking             — newest first; relevance breaks ties
 */

import {
  computeFieldRelevance,
  filterByFieldRelevance,
  resolveIndustryKey,
} from "./field-relevance";
import { isGloballyOffTopic } from "./profession-filters";
import { isWrapperOrSearchUrl } from "./text";
import type { FeedItem } from "./types";

const BLOCKLIST_TERMS = [
  "coupon", "promo code", "discount code", "% off", "save up to",
  "free shipping", "deal of the day", "best price",
  "you won't believe", "shocking truth", "doctors hate",
  "one weird trick", "this one trick",
  "sponsored post", "paid partnership", "affiliate link",
  "subscribe to newsletter", "click here to read",
  "bootcamp enrollment", "certification course",
];

const GENERIC_AI_PATTERNS = [
  /^(openai|anthropic|google|meta|microsoft|apple|nvidia|amazon|sam altman|elon musk)\s/i,
  /releases? (new |its )?(ai |gpt|gemini|claude|llama)/i,
  /launches? (new )?(ai |chatbot|llm)/i,
  /(gpt-\d|claude \d|gemini \d|llama \d)/i,
  /raises? \$[\d.]+[mb] (for|in) (ai|llm)/i,
  /stock (surges|drops|rally|plunge)/i,
  /earnings (beat|miss|report)/i,
];

const TRUSTED_SOURCES = [
  "techcrunch", "wired", "theverge", "venturebeat", "arstechnica",
  "nature", "science", "nejm", "statnews", "medcity", "edsurge",
  "openai", "anthropic", "deepmind", "hugging face", "google ai",
  "github blog", "hacker news", "y combinator", "a16z",
  "mit technology review", "ieee", "figma blog",
  "hubspot", "medium", "dev.to", "youtube",
];

function isGenericAiHeadline(title: string, professionKey: string): boolean {
  if (professionKey === "software-engineer" || professionKey === "entrepreneur") {
    return false;
  }
  return GENERIC_AI_PATTERNS.some((p) => p.test(title));
}

function isLowQuality(item: FeedItem, professionKey: string): boolean {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (BLOCKLIST_TERMS.some((t) => text.includes(t))) return true;
  if (isGloballyOffTopic(text)) return true;
  if (isGenericAiHeadline(item.title, professionKey)) return true;
  return false;
}

function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function dedupe(items: FeedItem[]): FeedItem[] {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();

  return items.filter((item) => {
    const ytVideoId = item.url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
    const urlKey = ytVideoId
      ? `yt:${ytVideoId}`
      : item.url.replace(/[?#].*$/, "").toLowerCase();

    const titleKey = normaliseTitle(item.title);

    if (seenUrl.has(urlKey) || seenTitle.has(titleKey)) return false;
    seenUrl.add(urlKey);
    seenTitle.add(titleKey);
    return true;
  });
}

function parsePublishedAtMs(publishedAt: string): number {
  const ms = new Date(publishedAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Newest first; relevance score breaks ties on the same publish time. */
export function sortNewestFirst(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const dateDiff = parsePublishedAtMs(b.publishedAt) - parsePublishedAtMs(a.publishedAt);
    if (dateDiff !== 0) return dateDiff;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

function relevanceScore(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 1) return 1.0;
  if (ageDays < 3) return 0.9;
  if (ageDays < 7) return 0.75;
  if (ageDays < 14) return 0.5;
  if (ageDays < 30) return 0.25;
  return 0.1;
}

function sourceScore(source: string): number {
  const s = source.toLowerCase();
  const match = TRUSTED_SOURCES.find((ts) => s.includes(ts));
  return match ? 0.75 : 0.35;
}

export function truncateSummary(text: string, maxWords = 60): string {
  if (!text) return "";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export function rankAndFilter(
  items: FeedItem[],
  primaryIndustry: string,
): FeedItem[] {
  const professionKey = resolveIndustryKey(primaryIndustry);

  const quality = items.filter(
    (i) => !isLowQuality(i, professionKey) && !isWrapperOrSearchUrl(i.url),
  );
  const unique = dedupe(quality);

  const resolveIndustry = (item: FeedItem) =>
    resolveIndustryKey(item.industry?.trim() || primaryIndustry);

  const relevant = filterByFieldRelevance(unique, resolveIndustry);

  const scored = relevant.map((item) => {
    const industry = resolveIndustry(item);
    const fieldRel = computeFieldRelevance(item, industry);
    const rec = relevanceScore(item.publishedAt);
    const src = sourceScore(item.source);

    // Used only as tiebreaker — display order is newest-first
    const score = fieldRel * 0.65 + rec * 0.2 + src * 0.15;

    return {
      ...item,
      summary: truncateSummary(item.summary, 80),
      score,
    };
  });

  return sortNewestFirst(scored);
}

/**
 * Video feed ranking — YouTube provider already enforces strict profession × AI
 * scoring (buildVideoPool, min 8). Only dedupe, blocklist, and recency here.
 */
export function rankVideos(
  items: FeedItem[],
  primaryIndustry: string,
): FeedItem[] {
  const professionKey = resolveIndustryKey(primaryIndustry);

  const quality = items.filter(
    (i) => !isLowQuality(i, professionKey) && !isWrapperOrSearchUrl(i.url),
  );
  const unique = dedupe(quality);

  const prepared = unique.map((item) => ({
    ...item,
    summary: truncateSummary(item.summary, 80),
    score: item.score ?? 0,
  }));

  return sortNewestFirst(prepared);
}
