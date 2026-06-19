/**
 * Medium Provider
 *
 * Strategy (in order of preference):
 *   1. Medium tag RSS  — medium.com/feed/tag/<slug>  (most relevant)
 *   2. Dev.to tag RSS  — dev.to/feed/tag/<slug>       (developer-heavy backup)
 *   3. Curated publisher RSS per industry              (guaranteed fallback)
 *
 * No Playwright needed — Medium and Dev.to expose public RSS feeds for
 * every tag. We derive the tag slug from the industry name and the
 * pre-defined query strings.
 */

import https from "https";
import http from "http";
import {
  getArticlePublishers,
  getArticleTags,
  resolveIndustryKey,
} from "./industry-config";
import { getProfession } from "./profession-config";
import { stripHtml, formatStorySummary, isWrapperOrSearchUrl } from "./text";
import { sortNewestFirst } from "./ranker";
import { createStoryId } from "@/lib/story-id";
import type { FeedItem, FeedProvider } from "./types";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpAgent = new http.Agent();

// ── HTTP helper ──────────────────────────────────────────────────────────────

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
            "user-agent": "Mozilla/5.0 (compatible; Vitamin-AI/1.0; +https://vitamin-ai.app)",
            accept: "application/rss+xml, application/xml, text/xml, */*",
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

// ── XML / RSS parser ─────────────────────────────────────────────────────────

function parseRss(xml: string, sourceName: string, limit: number): FeedItem[] {
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
      b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ??
      b.match(/<link[^>]*href=["']([^"']+)"/i)?.[1] ??
      "";
    if (link && !/^https?:\/\//.test(link)) link = "";

    const rawDesc =
      b.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
      b.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
      b.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ??
      b.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ??
      "";

    const desc = formatStorySummary(title, rawDesc, sourceName);

    const pubRaw =
      b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ??
      b.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ??
      b.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ??
      "";

    const thumbnail =
      b.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)?.[1] ??
      b.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i)?.[1] ??
      null;

    if (!title || !link || isWrapperOrSearchUrl(link)) continue;

    items.push({
      id: createStoryId(link, "Articles"),
      title,
      summary: desc || `Read more on ${sourceName}`,
      url: link,
      thumbnail,
      source: sourceName,
      publishedAt: pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString(),
      contentType: "Articles",
      industry: "",
    });
  }

  return items;
}

// ── Provider export ──────────────────────────────────────────────────────────

export const mediumProvider: FeedProvider = {
  name: "Medium",

  async fetch(industry, _contentType, limit) {
    const key = resolveIndustryKey(industry);
    const prof = getProfession(key);
    const tags = getArticleTags(key);
    const perTag = Math.ceil(limit / Math.min(tags.length, 5)) + 3;

    // Top 4 tags × 2 sources (Medium + Dev.to) = 8 parallel requests max
    const sources = tags.slice(0, 4).flatMap((tag) => [
      { name: `Medium · ${tag}`, url: `https://medium.com/feed/tag/${tag}` },
      { name: `Dev.to · ${tag}`, url: `https://dev.to/feed/tag/${tag}` },
    ]);

    // HackerNoon is reliable and fast; add first article tag
    const firstTag = tags[0] ?? prof?.articleTags?.[0];
    const extraSources: { name: string; url: string }[] = firstTag
      ? [{ name: `HackerNoon · ${firstTag}`, url: `https://hackernoon.com/tagged/${firstTag}/feed` }]
      : [];

    const allSources = [...sources, ...extraSources];

    const rssResults = await Promise.allSettled(
      allSources.map(async ({ name, url }) => {
        const xml = await fetchText(url);
        return xml ? parseRss(xml, name, perTag + 2) : ([] as FeedItem[]);
      }),
    );

    let items = rssResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

    // Only hit fallback publishers if we have very few raw items
    if (items.length < 12) {
      const fallbacks = getArticlePublishers(key);
      if (fallbacks.length > 0) {
        const fallbackResults = await Promise.allSettled(
          fallbacks.slice(0, 3).map(async (f) => {
            const xml = await fetchText(f.rss);
            return xml ? parseRss(xml, f.name, Math.ceil(limit / 2)) : ([] as FeedItem[]);
          }),
        );

        items = [
          ...items,
          ...fallbackResults.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
        ];
      }
    }

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

    function scoreArticleItem(item: FeedItem): number {
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

    const scored = items
      .map((item) => ({ item, score: scoreArticleItem(item) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score);

    let qualityPool = scored.filter(({ score }) => score >= 50);
    if (qualityPool.length < 12) {
      qualityPool = scored.filter(({ score }) => score >= 35);
    }

    const ranked = sortNewestFirst(
      qualityPool
        .map(({ item }) => ({ ...item, industry: key, score: 0 }))
        .slice(0, limit + 24),
    );

    return ranked.map(({ score: _s, ...item }) => item);
  },
};
