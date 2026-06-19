/**
 * Server-side feed fetcher — no CORS limits.
 * Used by /api/feed for the live interest-based feed.
 */

import https from "https";
import http from "http";
import { getClientSources } from "@/lib/client-sources";
import type { FeedStory } from "@/lib/client-rss";
import { createStoryId } from "@/lib/story-id";

export type { FeedStory };

// Permissive agent for dev environments where CA certs may not be fully trusted.
// In production this is a no-op because NODE_TLS_REJECT_UNAUTHORIZED is not set to 0.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpAgent = new http.Agent();

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail?: string;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = [
    ...xml.matchAll(/<item[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi),
  ];
  for (const m of blocks) {
    const b = m[0];
    const title = stripHtml(
      (b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim(),
    );
    let link = "";
    const atomAlt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)"/i)?.[1];
    if (atomAlt) link = atomAlt;
    if (!link) {
      const rssLink = b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
      if (rssLink && /^https?:\/\//.test(rssLink.trim())) link = rssLink.trim();
    }
    if (!link) {
      const atomLink = b.match(/<link[^>]*href=["']([^"']+)"/i)?.[1];
      if (atomLink) link = atomLink;
    }
    const description = stripHtml(
      (b.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
        b.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ??
        b.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i)?.[1] ??
        b.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ??
        "").trim(),
    ).slice(0, 400);
    const pubRaw =
      b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ??
      b.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ??
      b.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ??
      "";
    const pubDate = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();
    const thumbnail =
      b.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)?.[1] ??
      b.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i)?.[1] ??
      undefined;
    if (title && link) items.push({ title, link, description, pubDate, thumbnail });
  }
  return items;
}

async function fetchText(url: string, timeoutMs = 10000): Promise<string | null> {
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
          headers: {
            "user-agent": "Mozilla/5.0 (compatible; Vitamin-AI/1.0; +https://vitamin-ai.app)",
            accept: "application/rss+xml, application/xml, text/xml, */*",
            "accept-encoding": "identity",
          },
          timeout: timeoutMs,
        },
        (res) => {
          // Follow redirects (up to 3)
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
          res.on("data", (chunk: string) => (data += chunk));
          res.on("end", () => resolve(data));
          res.on("error", () => resolve(null));
        },
      );

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

function toStories(
  items: RssItem[],
  source: { name: string },
  contentType: "News" | "Articles",
  limit: number,
): FeedStory[] {
  return items.slice(0, limit).map((i) => ({
    id: createStoryId(i.link, contentType),
    headline: i.title,
    summary: i.description || `Latest from ${source.name}`,
    image_url: i.thumbnail ?? null,
    source_url: i.link,
    source_name: source.name,
    published_at: i.pubDate,
    content_type: contentType,
    category: contentType,
    why_it_matters: null,
  }));
}

async function fetchRssSource(
  source: { name: string; rss: string },
  contentType: "News" | "Articles",
  limit: number,
): Promise<FeedStory[]> {
  const xml = await fetchText(source.rss);
  if (!xml) return [];
  return toStories(parseRss(xml), source, contentType, limit);
}

async function fetchYouTubeChannel(
  ch: { name: string; channelId: string },
  limit: number,
): Promise<FeedStory[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
  const xml = await fetchText(url);
  if (!xml) return [];

  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const rows: FeedStory[] = [];

  for (const e of entries.slice(0, limit)) {
    const title = stripHtml(e.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const link =
      e.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)"/i)?.[1] ??
      e.match(/<link[^>]*href=["']([^"']+)"/i)?.[1] ??
      "";
    const videoId =
      e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1] ??
      e.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)?.[1] ??
      "";
    const published =
      e.match(/<published>([^<]+)<\/published>/i)?.[1] ??
      new Date().toISOString();
    const desc = stripHtml(
      e.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i)?.[1] ?? "",
    ).slice(0, 320);

    if (!title || !link) continue;

    rows.push({
      id: createStoryId(link || `https://www.youtube.com/watch?v=${videoId}`, "Videos"),
      headline: title,
      summary: desc || `New video from ${ch.name}`,
      image_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
      source_url: link,
      source_name: `YouTube · ${ch.name}`,
      published_at: new Date(published).toISOString(),
      content_type: "Videos",
      category: "Videos",
      why_it_matters: null,
    });
  }

  return rows;
}

export function dedupeStories(stories: FeedStory[]): FeedStory[] {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  return stories.filter((s) => {
    const tKey = s.headline.toLowerCase().replace(/[^a-z0-9 ]/g, "").slice(0, 80);
    if (seenUrl.has(s.source_url) || seenTitle.has(tKey)) return false;
    seenUrl.add(s.source_url);
    seenTitle.add(tKey);
    return true;
  });
}

export function sortByDate(stories: FeedStory[]): FeedStory[] {
  return [...stories].sort(
    (a, b) => +new Date(b.published_at) - +new Date(a.published_at),
  );
}

export interface FetchFeedOptions {
  interests: string[];
  contentTypes: ("News" | "Videos" | "Articles")[];
}

/**
 * Fetch stories for the given interests and content types.
 * Runs on the server only.
 */
/** Hard-coded guaranteed fallbacks that are known to work server-side */
const FALLBACK_NEWS = [
  { name: "TechCrunch", rss: "https://techcrunch.com/feed/" },
  { name: "The Verge", rss: "https://www.theverge.com/rss/index.xml" },
  { name: "Wired", rss: "https://www.wired.com/feed/rss" },
];
const FALLBACK_ARTICLES = [
  { name: "Hugging Face", rss: "https://huggingface.co/blog/feed.xml" },
  { name: "Dev.to", rss: "https://dev.to/feed" },
  { name: "OpenAI Blog", rss: "https://openai.com/blog/rss.xml" },
];
const FALLBACK_YT = [
  { name: "Two Minute Papers", channelId: "UCbfYPyITQ-7l4upoX8nvctg" },
  { name: "Matt Wolfe", channelId: "UChpleBmo18P08aKCIgti38g" },
  { name: "Fireship", channelId: "UCsBjURrPoezykLs9EqgamOA" },
];

export async function fetchFeedForInterests({
  interests,
  contentTypes,
}: FetchFeedOptions): Promise<FeedStory[]> {
  if (interests.length === 0) return [];

  const types =
    contentTypes.length > 0
      ? contentTypes
      : (["News", "Videos", "Articles"] as const);

  const sources = getClientSources(interests);
  const wantNews = types.includes("News");
  const wantArticles = types.includes("Articles");
  const wantVideos = types.includes("Videos");

  const tasks: Promise<FeedStory[]>[] = [];

  if (wantNews) {
    for (const n of sources.news.slice(0, 8)) {
      tasks.push(fetchRssSource(n, "News", 8));
    }
  }
  if (wantArticles) {
    for (const a of sources.articles.slice(0, 8)) {
      tasks.push(fetchRssSource(a, "Articles", 6));
    }
  }
  if (wantVideos) {
    for (const y of sources.youtube.slice(0, 6)) {
      tasks.push(fetchYouTubeChannel(y, 6));
    }
  }

  const batches = await Promise.allSettled(tasks);
  let all = batches.flatMap((b) => (b.status === "fulfilled" ? b.value : []));

  // If any requested content type yielded nothing, add reliable fallbacks
  const hasNews = all.some((s) => s.content_type === "News");
  const hasArticles = all.some((s) => s.content_type === "Articles");
  const hasVideos = all.some((s) => s.content_type === "Videos");

  const fallbackTasks: Promise<FeedStory[]>[] = [];
  if (wantNews && !hasNews) {
    for (const n of FALLBACK_NEWS) fallbackTasks.push(fetchRssSource(n, "News", 6));
  }
  if (wantArticles && !hasArticles) {
    for (const a of FALLBACK_ARTICLES) fallbackTasks.push(fetchRssSource(a, "Articles", 5));
  }
  if (wantVideos && !hasVideos) {
    for (const y of FALLBACK_YT) fallbackTasks.push(fetchYouTubeChannel(y, 5));
  }

  if (fallbackTasks.length > 0) {
    const fallbackBatches = await Promise.allSettled(fallbackTasks);
    const fallbackResults = fallbackBatches.flatMap((b) =>
      b.status === "fulfilled" ? b.value : [],
    );
    all = [...all, ...fallbackResults];
  }

  return sortByDate(dedupeStories(all));
}
