/**
 * Client-side RSS fetcher.
 * Uses allorigins.win as a CORS proxy so we can fetch any RSS feed directly
 * from the browser without a backend.
 */

import { createStoryId } from "@/lib/story-id";

export interface FeedStory {
  id: string;
  headline: string;
  summary: string;
  image_url: string | null;
  source_url: string;
  source_name: string;
  published_at: string;
  content_type: "News" | "Videos" | "Articles";
  category: string;
  /** Pre-filled from channel meta, null until user clicks */
  why_it_matters: null;
}

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

function extractImage(item: Element): string | null {
  // <media:thumbnail url="...">
  const mt = item.querySelector("thumbnail");
  if (mt?.getAttribute("url")) return mt.getAttribute("url");
  // <enclosure type="image/...">
  const enc = item.querySelector("enclosure");
  if (enc?.getAttribute("type")?.startsWith("image")) return enc.getAttribute("url");
  // <img> inside description
  const desc =
    item.querySelector("description")?.textContent ?? "";
  const m = desc.match(/<img[^>]+src="([^"]+)"/i);
  if (m) return m[1];
  return null;
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "text/xml");
}

/** Fetch via allorigins CORS proxy */
async function proxyFetch(url: string, timeout = 8000): Promise<string | null> {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(proxy, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const json = await r.json() as { contents: string };
    return json.contents ?? null;
  } catch {
    return null;
  }
}

export async function fetchRssFeed(
  source: { name: string; rss: string },
  contentType: "News" | "Articles",
  limit = 8,
): Promise<FeedStory[]> {
  const xml = await proxyFetch(source.rss);
  if (!xml) return [];

  const doc = parseXml(xml);
  const items = [...doc.querySelectorAll("item, entry")].slice(0, limit);

  return items.map((item, i): FeedStory => {
    const title =
      stripHtml(item.querySelector("title")?.textContent ?? "").trim();

    // link: try <link href="...">, then text content
    let link =
      item.querySelector("link[href]")?.getAttribute("href") ??
      item.querySelector("link")?.textContent?.trim() ??
      "";

    // For atom feeds <link> might be a tag not text
    if (!link) {
      const l = item.querySelector("link");
      link = l?.getAttribute("href") ?? l?.textContent?.trim() ?? "";
    }

    const desc = stripHtml(
      item.querySelector("description")?.textContent ??
        item.querySelector("summary")?.textContent ??
        item.querySelector("content")?.textContent ??
        "",
    )
      .slice(0, 200)
      .trim();

    const pubRaw =
      item.querySelector("pubDate")?.textContent ??
      item.querySelector("published")?.textContent ??
      item.querySelector("updated")?.textContent ??
      "";

    const pub = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();
    const image = extractImage(item);

    return {
      id: createStoryId(link || source.rss, contentType),
      headline: title || `Story from ${source.name}`,
      summary: desc || `Latest from ${source.name}`,
      image_url: image,
      source_url: link || source.rss,
      source_name: source.name,
      published_at: pub,
      content_type: contentType,
      category: contentType === "News" ? "News" : "Articles",
      why_it_matters: null,
    };
  }).filter((s) => s.headline && s.source_url);
}

export async function fetchYouTubeFeed(
  ch: { name: string; channelId: string },
  limit = 6,
): Promise<FeedStory[]> {
  // YouTube Atom feeds are CORS-accessible directly — no proxy needed.
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return [];
    const xml = await r.text();
    const doc = parseXml(xml);
    const entries = [...doc.querySelectorAll("entry")].slice(0, limit);

    return entries.map((e, i): FeedStory => {
      const title = stripHtml(e.querySelector("title")?.textContent ?? "");
      const link = e.querySelector("link")?.getAttribute("href") ?? "";
      const videoId = e.querySelector("videoId")?.textContent ?? "";
      const pub = e.querySelector("published")?.textContent ?? new Date().toISOString();
      const desc = stripHtml(
        e.querySelector("description")?.textContent ?? "",
      ).slice(0, 200);

      return {
        id: createStoryId(link || `https://www.youtube.com/watch?v=${videoId}`, "Videos"),
        headline: title || ch.name,
        summary: desc || `New video from ${ch.name}`,
        image_url: videoId
          ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          : null,
        source_url: link,
        source_name: `YouTube · ${ch.name}`,
        published_at: new Date(pub).toISOString(),
        content_type: "Videos",
        category: "Videos",
        why_it_matters: null,
      };
    }).filter((s) => s.headline && s.source_url);
  } catch {
    return [];
  }
}

/** Deduplicate by URL */
export function dedupeStories(stories: FeedStory[]): FeedStory[] {
  const seen = new Set<string>();
  return stories.filter((s) => {
    if (seen.has(s.source_url)) return false;
    seen.add(s.source_url);
    return true;
  });
}

/** Sort by date, newest first */
export function sortByDate(stories: FeedStory[]): FeedStory[] {
  return [...stories].sort(
    (a, b) => +new Date(b.published_at) - +new Date(a.published_at),
  );
}
