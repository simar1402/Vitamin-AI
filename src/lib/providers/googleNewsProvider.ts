/**
 * Google News Provider
 *
 * Strategy: Google News RSS search endpoint
 *   https://news.google.com/rss/search?q=<query>&hl=en-US&gl=US&ceid=US:en
 *
 * Google News RSS works server-side when called with a regular browser
 * User-Agent. Each industry fires 2-3 targeted queries. Results are
 * parsed from the RSS XML directly — no Playwright required.
 *
 * If the Google News RSS returns nothing (occasionally rate-limited),
 * the provider falls back to curated publisher RSS feeds that are
 * reliable for each industry.
 */

import https from "https";
import http from "http";
import { getProfession } from "./profession-config";
import { getNewsFeeds, resolveIndustryKey, UNIVERSAL_NEWS } from "./industry-config";
import { stripHtml, formatStorySummary, isWrapperOrSearchUrl } from "./text";
import { sortNewestFirst } from "./ranker";
import { createStoryId } from "@/lib/story-id";
import type { FeedItem, FeedProvider } from "./types";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpAgent = new http.Agent();

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 6000): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === "https:";
      const mod = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;

      const req = mod.get(
        url,
        {
          agent,
          timeout: timeoutMs,
          headers: {
            // Must look like a browser to get past Google's bot filter
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
              "AppleWebKit/537.36 (KHTML, like Gecko) " +
              "Chrome/124.0.0.0 Safari/537.36",
            accept: "application/rss+xml, application/xml, text/xml, */*",
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "identity",
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            resolve(fetchText(res.headers.location, timeoutMs));
            res.resume();
            return;
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume();
            resolve(null);
            return;
          }
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (c: string) => (data += c));
          res.on("end", () => resolve(data));
          res.on("error", () => resolve(null));
        },
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
    } catch { resolve(null); }
  });
}

// ── XML parser ───────────────────────────────────────────────────────────────

async function fetchRssNews(
  feed: { name: string; rss: string },
  limit: number,
): Promise<FeedItem[]> {
  const xml = await fetchText(feed.rss);
  if (!xml) return [];

  const blocks = [
    ...xml.matchAll(/<item[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi),
  ];

  const items: FeedItem[] = [];
  for (const m of Array.from(blocks).slice(0, limit)) {
    const b = m[0];
    const title = stripHtml(b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();

    let link =
      b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)"/i)?.[1] ??
      b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ??
      b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ??
      "";
    if (link && !/^https?:\/\//.test(link)) link = "";

    const sourceMatch = b.match(/<source[^>]*url=["']([^"']+)["'][^>]*>([^<]*)<\/source>/i);
    const publisherName = sourceMatch?.[2]?.trim() || feed.name;

    const rawDesc =
      b.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
      b.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
      b.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ??
      "";

    const desc = formatStorySummary(title, rawDesc, publisherName);

    const pubRaw =
      b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ??
      b.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ??
      b.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ??
      "";

    if (!title || !link || isWrapperOrSearchUrl(link)) continue;

    items.push({
      id: createStoryId(link, "News"),
      title,
      summary: desc || `Latest from ${publisherName}`,
      url: link,
      thumbnail:
        b.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)?.[1] ?? null,
      source: publisherName,
      publishedAt: pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString(),
      contentType: "News",
      industry: "",
    });
  }

  return items;
}

// ── Provider export ──────────────────────────────────────────────────────────
// Uses HN + direct publisher RSS only — never Google News wrapper URLs.

export const googleNewsProvider: FeedProvider = {
  name: "News",

  async fetch(industry, _contentType, limit) {
    const key = resolveIndustryKey(industry);
    const prof = getProfession(key);

    // HN + direct publisher RSS — all links resolve to real article URLs
    const hnFeeds = getNewsFeeds(key);
    const directFeeds = UNIVERSAL_NEWS;

    const feeds = [...hnFeeds, ...directFeeds];
    const feedCount = Math.min(feeds.length, 8);
    const perFeed = Math.ceil(limit / feedCount) + 4;

    const results = await Promise.allSettled(
      feeds.slice(0, feedCount).map((f) => fetchRssNews(f, perFeed)),
    );

    const rawItems = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .map((i) => ({ ...i, industry: key }));

    const STRONG_AI = [
      "artificial intelligence",
      "machine learning",
      "llm",
      "chatgpt",
      "claude",
      "gemini",
      "copilot",
      "generative ai",
    ];
    const profAnchors = prof?.anchors ?? [];

    function scoreNewsItem(item: FeedItem): number {
      const title = item.title.toLowerCase();
      const summary = item.summary.toLowerCase();
      const combined = `${title} ${summary}`;

      const hasAnchor = profAnchors.some(
        (a) => a.length >= 4 && combined.includes(a.toLowerCase()),
      );
      const hasAI =
        STRONG_AI.some((t) => combined.includes(t)) ||
        /\b(ai|llm|gpt)\b/i.test(combined);

      if (!hasAnchor && !hasAI) return -1;

      const titleHasAnchor = profAnchors.some(
        (a) => a.length >= 4 && title.includes(a.toLowerCase()),
      );
      const titleHasAI =
        STRONG_AI.some((t) => title.includes(t)) || /\b(ai|llm|gpt)\b/i.test(item.title);
      const summaryHasAnchor = profAnchors.some(
        (a) => a.length >= 4 && summary.includes(a.toLowerCase()),
      );
      const summaryHasAI =
        STRONG_AI.some((t) => summary.includes(t)) || /\b(ai|llm|gpt)\b/i.test(item.summary);

      let score = 0;
      if (titleHasAnchor) score += 35;
      if (summaryHasAnchor) score += 10;
      if (titleHasAI) score += 30;
      if (summaryHasAI) score += 10;
      if (titleHasAnchor && titleHasAI) score += 15;

      const ageDays = (Date.now() - new Date(item.publishedAt).getTime()) / 86400000;
      if (ageDays < 7) score += 10;
      else if (ageDays < 30) score += 5;

      return score;
    }

    const scored = rawItems
      .map((item) => ({ item, score: scoreNewsItem(item) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score);

    let qualityPool = scored.filter(({ score }) => score >= 50);
    if (qualityPool.length < 12) {
      qualityPool = scored.filter(({ score }) => score >= 35);
    }

    const items = qualityPool
      .map(({ item }) => item)
      .slice(0, limit + 24);

    return sortNewestFirst(
      items.map((item) => ({ ...item, industry: key, score: 0 })),
    ).map(({ score: _s, ...item }) => item);
  },
};
