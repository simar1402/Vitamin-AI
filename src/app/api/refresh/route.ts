import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/integrations/supabase/server";
import { getSourcesFor } from "@/lib/sources";
import { isKnownBlockedUrl, webSearchUrl } from "@/lib/external-links";

const InputSchema = z.object({
  profession: z.string().max(80).optional(),
  contentTypes: z.array(z.enum(["News", "Videos", "Articles"])).optional(),
});

interface Row {
  headline: string;
  summary: string;
  why_it_matters: string | null;
  category: string;
  content_type: "News" | "Videos" | "Articles";
  source_url: string;
  source_name: string;
  image_url: string | null;
  tags: string[];
  published_at: string;
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
    const rssLink = b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1];
    if (rssLink && /^https?:\/\//.test(rssLink.trim())) link = rssLink.trim();
    if (!link) {
      const atomLink = b.match(/<link[^>]*href="([^"]+)"/i)?.[1];
      if (atomLink) link = atomLink;
    }
    const description = stripHtml(
      (b.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
        b.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ??
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
      b.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] ??
      b.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1] ??
      undefined;
    if (title && link) items.push({ title, link, description, pubDate, thumbnail });
  }
  return items;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      headers: { "user-agent": "Vitamin-AI/1.0" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

async function fetchNewsFeed(feed: { name: string; rss: string }): Promise<Row[]> {
  const xml = await fetchText(feed.rss);
  if (!xml) return [];
  return parseRss(xml).slice(0, 8).map((i) => ({
    headline: i.title,
    summary: i.description || `Latest from ${feed.name}`,
    why_it_matters: null,
    category: "News",
    content_type: "News" as const,
    source_url: i.link,
    source_name: feed.name,
    image_url: i.thumbnail ?? null,
    tags: [feed.name],
    published_at: i.pubDate,
  }));
}

async function fetchBlog(blog: { name: string; rss: string }): Promise<Row[]> {
  const xml = await fetchText(blog.rss);
  if (!xml) return [];
  return parseRss(xml).slice(0, 6).map((i) => ({
    headline: i.title,
    summary: i.description || `New post from ${blog.name}`,
    why_it_matters: null,
    category: "Articles",
    content_type: "Articles" as const,
    source_url: i.link,
    source_name: blog.name,
    image_url: i.thumbnail ?? null,
    tags: [blog.name],
    published_at: i.pubDate,
  }));
}

async function fetchYouTube(ch: { name: string; channelId: string }): Promise<Row[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
  const xml = await fetchText(url);
  if (!xml) return [];
  const rows: Row[] = [];
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
  for (const e of entries.slice(0, 6)) {
    const title = stripHtml(e.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const link = e.match(/<link[^>]*href="([^"]+)"/)?.[1];
    const videoId = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1];
    const desc = stripHtml(
      e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "",
    ).slice(0, 320);
    if (!title || !link) continue;
    rows.push({
      headline: title,
      summary: desc || `New video from ${ch.name}`,
      why_it_matters: null,
      category: "Videos",
      content_type: "Videos",
      source_url: link,
      source_name: `YouTube · ${ch.name}`,
      image_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
      tags: ["Video", ch.name],
      published_at: published ? new Date(published).toISOString() : new Date().toISOString(),
    });
  }
  return rows;
}

const CLICKBAIT = /\b(you won'?t believe|shocking|insane|crazy|gone wrong|clickbait|hack)\b/i;

function scoreRow(row: Row, keywords: string[]): number {
  const hay = `${row.headline} ${row.summary}`.toLowerCase();
  let s = 0;
  for (const k of keywords) if (hay.includes(k.toLowerCase())) s += 3;
  if (/\bai\b|llm|gpt|gemini|claude|anthropic|openai|agent/.test(hay)) s += 2;
  const ageHours = (Date.now() - +new Date(row.published_at)) / 36e5;
  if (ageHours < 24) s += 4;
  else if (ageHours < 72) s += 2;
  else if (ageHours < 168) s += 1;
  if (CLICKBAIT.test(row.headline)) s -= 5;
  return s;
}

function dedupe(rows: Row[]): Row[] {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const out: Row[] = [];
  for (const r of rows) {
    const tKey = r.headline.toLowerCase().replace(/[^a-z0-9 ]/g, "").slice(0, 80);
    if (seenUrl.has(r.source_url) || seenTitle.has(tKey)) continue;
    seenUrl.add(r.source_url);
    seenTitle.add(tKey);
    out.push(r);
  }
  return out;
}

function withSafeSource(row: Row): Row {
  if (!isKnownBlockedUrl(row.source_url)) return row;
  return row;
}

async function enrich(rows: Row[], profession: string): Promise<Row[]> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey || rows.length === 0) return rows;

  const items = rows.slice(0, 24).map((r, i) => ({
    i,
    title: r.headline,
    source: r.source_name,
    excerpt: r.summary.slice(0, 280),
  }));

  const system = `You are an expert AI newsletter editor for a ${profession || "professional"}.
For each item, write:
- summary: <=60 words, plain, no marketing fluff, focused on what changed.
- why: <=30 words explaining the concrete impact for a ${profession || "professional"}.
If an item is off-topic, generic clickbait, or not actually AI-related, set drop:true.`;

  const endpoint = process.env.LOVABLE_API_KEY
    ? "https://ai.gateway.lovable.dev/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LOVABLE_API_KEY ? "google/gemini-2.5-flash-lite" : "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(items) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "enrich_items",
              description: "Return summary, why-it-matters, and drop flag per item.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        i: { type: "number" },
                        summary: { type: "string" },
                        why: { type: "string" },
                        drop: { type: "boolean" },
                      },
                      required: ["i", "summary", "why", "drop"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "enrich_items" } },
      }),
    });

    if (!r.ok) return rows;

    const data = (await r.json()) as {
      choices: Array<{
        message: {
          tool_calls?: Array<{ function: { arguments: string } }>;
        };
      }>;
    };
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return rows;
    const parsed = JSON.parse(args) as {
      items: Array<{ i: number; summary: string; why: string; drop: boolean }>;
    };
    const byIdx = new Map(parsed.items.map((x) => [x.i, x]));
    const out: Row[] = [];
    rows.forEach((row, idx) => {
      const e = byIdx.get(idx);
      if (e?.drop) return;
      out.push({
        ...row,
        summary: e?.summary?.trim() || row.summary,
        why_it_matters: e?.why?.trim() || null,
      });
    });
    return out;
  } catch {
    return rows;
  }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profession, contentTypes } = InputSchema.parse(body);

    const prof = profession || "Other";
    const want = new Set(
      contentTypes && contentTypes.length > 0
        ? contentTypes
        : ["News", "Videos", "Articles"],
    );
    const sources = getSourcesFor(prof);

    const tasks: Promise<Row[]>[] = [];
    if (want.has("News")) {
      for (const f of shuffle(sources.news ?? []).slice(0, 8))
        tasks.push(fetchNewsFeed(f));
    }
    if (want.has("Articles")) {
      for (const b of shuffle(sources.blogs).slice(0, 10))
        tasks.push(fetchBlog(b));
    }
    if (want.has("Videos")) {
      for (const c of shuffle(sources.youtube).slice(0, 8))
        tasks.push(fetchYouTube(c));
    }

    const batches = await Promise.all(tasks);
    const all = batches.flat();
    const filtered = all.filter((r) => want.has(r.content_type));
    const deduped = dedupe(filtered);
    deduped.sort((a, b) => scoreRow(b, sources.keywords) - scoreRow(a, sources.keywords));
    const top = shuffle(deduped.slice(0, 80)).slice(0, 30);
    const enriched = (await enrich(top, prof)).map(withSafeSource);

    const admin = getSupabaseAdmin();
    await admin.from("stories").delete().not("id", "is", null);
    if (enriched.length) {
      const { error } = await admin.from("stories").insert(enriched);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ count: enriched.length, profession: prof });
  } catch (err) {
    console.error("[/api/refresh]", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}

// Also allow GET for easy browser testing
export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("stories")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(120);
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
