/**
 * YouTube Provider — v5
 *
 * Primary: Search API (when quota available) — profession × AI queries + Shorts
 * Fallback: Curated channel uploads via playlistItems (~10 API units total)
 *           Used when Search quota is exhausted (common on free tier)
 *
 * Scoring: AI + profession relevance, quality (likes/comments/subs), recency
 */

import https from "https";
import { resolveIndustryKey } from "./industry-config";
import { stripHtml } from "./text";
import { createStoryId } from "@/lib/story-id";
import type { FeedItem, FeedProvider } from "./types";
import {
  buildVideoQueries,
  getAISignalTerms,
  getProfessionChannels,
  PROFESSION_INTELLIGENCE,
} from "@/config/profession-intelligence";
import { getProfession } from "./profession-config";
import { getProfessionContext } from "./profession-context";
import {
  hasCrossProfessionLeak,
  isGloballyOffTopic,
} from "./profession-filters";
import { sortNewestFirst } from "./ranker";

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const MIN_VIDEOS = 8;
const MAX_VIDEOS = 16;
const MAX_GENERIC_VIDEOS = 2;
/** Only surface videos published within the last 2 months */
const MAX_AGE_DAYS = 60;
const RECENCY_WINDOW_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function publishedAfterIso(): string {
  return new Date(Date.now() - RECENCY_WINDOW_MS).toISOString();
}

function isWithinRecencyWindow(publishedAt: string): boolean {
  const ms = new Date(publishedAt).getTime();
  if (!Number.isFinite(ms)) return false;
  return Date.now() - ms <= RECENCY_WINDOW_MS;
}

/** Generic AI news channels — require strong real profession signal; capped in feed */
const GENERIC_AI_CHANNEL_IDS = new Set([
  "UCNJ1Ymd5yFuUPtn21xtRbbw", // AI Explained
  "UChpleBmo18P08aKCIgti38g", // Matt Wolfe
  "UCnzNE-AAIhWPZWDMpADFJZQ", // Wes Roth
  "UCbfYPyITQ-7l4upoX8nvctg", // Two Minute Papers
  "UCXv0mKKkT5JXNqMRBMN0Grg", // Matt Wolfe (alt id)
]);
const STRONG_AI_TERMS = [
  "artificial intelligence", "machine learning", "large language model",
  "generative ai", "gen ai", "deep learning", "chatgpt", "openai",
  "anthropic", "claude", "gemini", "copilot", "llm", "gpt-4", "gpt-5",
  "ai agent", "agentic ai", "prompt engineering", "fine-tuning",
  "rag", "retrieval augmented", "computer vision", "natural language processing",
  "midjourney", "stable diffusion", "dall-e", "github copilot", "cursor ai",
];

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { agent: httpsAgent, timeout: timeoutMs }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(fetchJson<T>(res.headers.location, timeoutMs)); res.resume(); return;
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume(); resolve(null); return;
        }
        let raw = "";
        res.setEncoding("utf8");
        res.on("data",  (c: string) => (raw += c));
        res.on("end",   () => { try { resolve(JSON.parse(raw) as T); } catch { resolve(null); } });
        res.on("error", () => resolve(null));
      });
      req.on("error",   () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
    } catch { resolve(null); }
  });
}

// ── YouTube Data API v3 ───────────────────────────────────────────────────────

interface YtSearchItem {
  id: { videoId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
  };
}
interface YtSearchResponse {
  items?: YtSearchItem[];
  error?: { message: string; code?: number; errors?: { reason: string }[] };
}

interface VideoEnrichment {
  description: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

type ScoredItem = FeedItem & {
  _viewCount?: number;
  _likeCount?: number;
  _commentCount?: number;
  _subscriberCount?: number;
  _channelId?: string;
  _fromCuratedChannel?: boolean;
  _nativeChannel?: boolean;
  _genericChannel?: boolean;
};

interface YtApiError {
  error?: { message?: string; errors?: { reason?: string }[] };
}

function isQuotaExceeded(data: YtApiError | null): boolean {
  if (!data?.error) return false;
  if (data.error.message?.includes("Quota exceeded")) return true;
  return data.error.errors?.some((e) => e.reason === "quotaExceeded") ?? false;
}

async function enrichVideos(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, VideoEnrichment>> {
  const map = new Map<string, VideoEnrichment>();
  if (!videoIds.length) return map;

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(batch)}&key=${apiKey}`;
    const data = await fetchJson<{
      items?: {
        id: string;
        snippet: { description: string };
        statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      }[];
    }>(url);
    if (!data?.items) continue;

    for (const item of data.items) {
      map.set(item.id, {
        description:  item.snippet?.description?.trim() ?? "",
        viewCount:    parseInt(item.statistics?.viewCount    ?? "0", 10),
        likeCount:    parseInt(item.statistics?.likeCount    ?? "0", 10),
        commentCount: parseInt(item.statistics?.commentCount ?? "0", 10),
      });
    }
  }
  return map;
}

async function enrichChannels(
  channelIds: string[],
  apiKey: string,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const unique = [...new Set(channelIds.filter(Boolean))];
  if (!unique.length) return map;

  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50).join(",");
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(batch)}&key=${apiKey}`;
    const data = await fetchJson<{
      items?: { id: string; statistics: { subscriberCount?: string } }[];
    }>(url);
    if (!data?.items) continue;

    for (const item of data.items) {
      map.set(item.id, parseInt(item.statistics?.subscriberCount ?? "0", 10));
    }
  }
  return map;
}

function channelFlags(
  channelId: string,
  nativeIds: Set<string>,
): { native: boolean; generic: boolean } {
  return {
    native: nativeIds.has(channelId),
    generic: GENERIC_AI_CHANNEL_IDS.has(channelId),
  };
}

async function searchYouTubeApi(
  query: string,
  apiKey: string,
  nativeIds: Set<string>,
  opts: { maxResults?: number; shorts?: boolean } = {},
): Promise<{ items: ScoredItem[]; quotaExceeded: boolean }> {
  const { maxResults = 20, shorts = false } = opts;
  const publishedAfter = publishedAfterIso();

  const params = new URLSearchParams({
    part:              "snippet",
    type:              "video",
    q:                 query,
    maxResults:        String(maxResults),
    order:             "date",
    relevanceLanguage: "en",
    publishedAfter,
    videoEmbeddable:   "true",
    safeSearch:        "moderate",
    key:               apiKey,
  });
  if (shorts) params.set("videoDuration", "short");

  const data = await fetchJson<YtSearchResponse>(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
  );

  if (isQuotaExceeded(data)) return { items: [], quotaExceeded: true };
  if (!data || data.error || !data.items?.length) return { items: [], quotaExceeded: false };

  const filtered = data.items.filter((i) => i.id.videoId);
  if (!filtered.length) return { items: [], quotaExceeded: false };

  const enrichment = await enrichVideos(filtered.map((i) => i.id.videoId!), apiKey);
  const channelIds = filtered.map((i) => i.snippet.channelId).filter(Boolean);
  const channelStats = await enrichChannels(channelIds, apiKey);

  const items = filtered.map((i) => {
    const vid  = i.id.videoId!;
    const info = enrichment.get(vid);
    const desc = info?.description ?? i.snippet.description;
    const summary = desc
      ? `${desc.slice(0, 800)} | channel: ${i.snippet.channelTitle} | topic: ${query}`
      : `Video from ${i.snippet.channelTitle} | topic: ${query}`;
    const flags = channelFlags(i.snippet.channelId, nativeIds);

    return {
      id:            createStoryId(`https://www.youtube.com/watch?v=${vid}`, "Videos"),
      title:         stripHtml(i.snippet.title),
      summary:       stripHtml(summary),
      url:           `https://www.youtube.com/watch?v=${vid}`,
      thumbnail:     i.snippet.thumbnails.high?.url
                       ?? i.snippet.thumbnails.medium?.url
                       ?? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      source:        `YouTube · ${i.snippet.channelTitle}`,
      publishedAt:   new Date(i.snippet.publishedAt).toISOString(),
      contentType:   "Videos" as const,
      industry:      "",
      _viewCount:    info?.viewCount    ?? 0,
      _likeCount:    info?.likeCount    ?? 0,
      _commentCount: info?.commentCount ?? 0,
      _channelId:    i.snippet.channelId,
      _subscriberCount: channelStats.get(i.snippet.channelId) ?? 0,
      _fromCuratedChannel: false,
      _nativeChannel: flags.native,
      _genericChannel: flags.generic,
    };
  });

  return { items: items.filter((i) => isWithinRecencyWindow(i.publishedAt)), quotaExceeded: false };
}

// ── Curated channel uploads (low-quota fallback) ─────────────────────────────
// channels.list (1 unit) + playlistItems × N (1 unit each) + videos.list (1–2 units)

async function fetchCuratedChannelVideos(
  channels: { name: string; channelId: string }[],
  apiKey: string,
  professionLabel: string,
  nativeIds: Set<string>,
): Promise<ScoredItem[]> {
  if (!channels.length) return [];

  const channelMeta = new Map<string, { uploads: string; subs: number; name: string }>();

  for (let i = 0; i < channels.length; i += 25) {
    const batch = channels.slice(i, i + 25);
    const channelIds = batch.map((c) => c.channelId).join(",");
    const chData = await fetchJson<{
      items?: {
        id: string;
        contentDetails: { relatedPlaylists: { uploads: string } };
        statistics: { subscriberCount?: string };
      }[];
    }>(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${encodeURIComponent(channelIds)}&key=${apiKey}`,
    );

    for (const ch of chData?.items ?? []) {
      channelMeta.set(ch.id, {
        uploads: ch.contentDetails.relatedPlaylists.uploads,
        subs: parseInt(ch.statistics.subscriberCount ?? "0", 10),
        name: channels.find((c) => c.channelId === ch.id)?.name ?? ch.id,
      });
    }
  }

  if (!channelMeta.size) return [];

  const playlistResults = await Promise.allSettled(
    [...channelMeta.entries()].map(async ([channelId, meta]) => {
      const plData = await fetchJson<{
        items?: {
          snippet: {
            resourceId: { videoId: string };
            title: string;
            description: string;
            channelTitle: string;
            channelId: string;
            publishedAt: string;
            thumbnails: { high?: { url: string }; medium?: { url: string } };
          };
        }[];
      }>(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(meta.uploads)}&maxResults=50&key=${apiKey}`,
      );

      return (plData?.items ?? [])
        .filter((i) => i.snippet.resourceId.videoId)
        .filter((i) => isWithinRecencyWindow(i.snippet.publishedAt))
        .map((i) => ({
          videoId: i.snippet.resourceId.videoId,
          snippet: i.snippet,
          channelId,
          channelName: meta.name,
          subs: meta.subs,
        }));
    }),
  );

  const rawEntries = playlistResults.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  if (!rawEntries.length) return [];

  const enrichment = await enrichVideos(rawEntries.map((e) => e.videoId), apiKey);

  return rawEntries.map((e) => {
    const info = enrichment.get(e.videoId);
    const desc = info?.description ?? e.snippet.description;
    const topic = `AI for ${professionLabel.toLowerCase()}`;
    const summary = desc
      ? `${desc.slice(0, 800)} | channel: ${e.channelName} | topic: ${topic}`
      : `Video by ${e.channelName} | topic: ${topic}`;
    const flags = channelFlags(e.channelId, nativeIds);

    return {
      id:            createStoryId(`https://www.youtube.com/watch?v=${e.videoId}`, "Videos"),
      title:         stripHtml(e.snippet.title),
      summary:       stripHtml(summary),
      url:           `https://www.youtube.com/watch?v=${e.videoId}`,
      thumbnail:     e.snippet.thumbnails.high?.url
                       ?? e.snippet.thumbnails.medium?.url
                       ?? `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`,
      source:        `YouTube · ${e.channelName}`,
      publishedAt:   new Date(e.snippet.publishedAt).toISOString(),
      contentType:   "Videos" as const,
      industry:      "",
      _viewCount:    info?.viewCount    ?? 0,
      _likeCount:    info?.likeCount    ?? 0,
      _commentCount: info?.commentCount ?? 0,
      _channelId:    e.channelId,
      _subscriberCount: e.subs,
      _fromCuratedChannel: true,
      _nativeChannel: flags.native,
      _genericChannel: flags.generic,
    };
  });
}

/** Curated channels from profession-intelligence + profession-config (deduped). */
function mergeProfessionChannels(professionId: string): { name: string; channelId: string }[] {
  const fromIntel = getProfessionChannels(professionId);
  const fromConfig = getProfession(professionId)?.ytChannels ?? [];
  const seen = new Set<string>();
  const merged: { name: string; channelId: string }[] = [];

  // Profession-native channels first; generic AI channels last
  for (const ch of [...fromIntel, ...fromConfig]) {
    if (seen.has(ch.channelId)) continue;
    seen.add(ch.channelId);
    merged.push(ch);
  }

  const native = merged.filter((c) => !GENERIC_AI_CHANNEL_IDS.has(c.channelId));
  const generic = merged.filter((c) => GENERIC_AI_CHANNEL_IDS.has(c.channelId));
  return [...native, ...generic];
}

function getNativeChannelIds(professionId: string): Set<string> {
  return new Set(getProfessionChannels(professionId).map((c) => c.channelId));
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function deduplicateVideos(items: FeedItem[]): FeedItem[] {
  const seenVid   = new Set<string>();
  const seenTitle = new Set<string>();
  return items.filter((item) => {
    const vid =
      item.url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] ??
      item.url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] ??
      item.id;
    const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seenVid.has(vid) || seenTitle.has(normTitle)) return false;
    seenVid.add(vid);
    seenTitle.add(normTitle);
    return true;
  });
}

// ── Relevance helpers ─────────────────────────────────────────────────────────

function extractDescription(summary: string): string {
  const idx = summary.indexOf(" | channel:");
  return (idx >= 0 ? summary.slice(0, idx) : summary).trim();
}

function buildProfessionAnchors(professionId: string): string[] {
  const intel = PROFESSION_INTELLIGENCE[professionId];
  const profLabel = getProfession(professionId)?.label.toLowerCase() ?? professionId.replace(/-/g, " ");
  if (!intel) return [profLabel, ...getProfessionContext(professionId)];

  return [
    profLabel,
    ...getProfessionContext(professionId),
    ...intel.aiWorkflows.map((w) => w.toLowerCase()),
    ...intel.aiUseCases.map((u) => u.toLowerCase()),
    ...intel.aiTopics.map((t) => t.toLowerCase()),
    ...intel.aiTools.slice(0, 8).map((t) => t.toLowerCase()),
  ].filter((a) => a.length >= 4);
}

function hasAISignal(text: string, title: string, professionId: string): boolean {
  const lower = text.toLowerCase();
  const titleLower = title.toLowerCase();

  if (STRONG_AI_TERMS.some((t) => lower.includes(t))) return true;

  for (const signal of getAISignalTerms(professionId)) {
    const sig = signal.toLowerCase();
    if (sig.length <= 3) {
      if (titleLower.includes(sig)) return true;
      continue;
    }
    if (lower.includes(sig)) return true;
  }
  return /\b(ai|llm|gpt|chatgpt|claude|gemini|copilot|machine learning)\b/i.test(titleLower);
}

function hasProfessionAiTool(title: string, description: string, professionId: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  const prof = getProfession(professionId);
  const intel = PROFESSION_INTELLIGENCE[professionId];
  const terms = [
    ...(prof?.tools ?? []),
    ...(intel?.aiTools ?? []),
    ...(intel?.aiCompanies ?? []),
  ].map((t) => t.toLowerCase());

  return terms.some((t) => t.length >= 4 && text.includes(t));
}

function hasProfessionSignal(title: string, description: string, professionId: string): boolean {
  const anchors = buildProfessionAnchors(professionId);
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  const titleHit = anchors.some((a) => titleLower.includes(a));
  const descHit  = anchors.some((a) => descLower.includes(a));

  // Title anchor = strong signal; description anchor = OK if paired with AI elsewhere
  return titleHit || descHit;
}

function passesRelevanceGate(item: ScoredItem, professionId: string): boolean {
  const title = item.title;
  const description = extractDescription(item.summary);
  const fullText = `${title} ${description}`;

  if (isGloballyOffTopic(fullText)) return false;

  const titleLower = title.toLowerCase();
  const anchors = buildProfessionAnchors(professionId);
  const hasOwnAnchor = anchors.some((a) => titleLower.includes(a));

  if (hasCrossProfessionLeak(titleLower, professionId) && !hasOwnAnchor) return false;

  const professionHit = hasProfessionSignal(title, description, professionId);
  const aiHit = hasAISignal(fullText, title, professionId);
  const professionToolHit = hasProfessionAiTool(title, description, professionId);

  // Native curated channel: profession terms + (AI signal OR profession-specific AI product)
  if (item._fromCuratedChannel && item._nativeChannel) {
    if (!professionHit) return false;
    return aiHit || professionToolHit;
  }

  // Generic channel or search result: must have both real profession + AI signals
  if (!aiHit) return false;
  if (!professionHit && !professionToolHit) return false;

  // Generic AI channels need explicit profession language (not just tool names)
  if (item._genericChannel && !professionHit) return false;

  return true;
}

// ── Quality score (0–25) — likes, comments, subscribers, velocity ───────────

function qualityScore(item: ScoredItem): number {
  const views    = item._viewCount    ?? 0;
  const likes    = item._likeCount    ?? 0;
  const comments = item._commentCount ?? 0;
  const subs     = item._subscriberCount ?? 0;
  const ageDays  = Math.max(
    (Date.now() - new Date(item.publishedAt).getTime()) / 86400000,
    1,
  );

  let score = 0;

  // Like ratio (0–8) — rewards well-received content
  if (views >= 50) {
    score += Math.min((likes / views) / 0.04, 1) * 8;
  } else if (likes >= 5) {
    score += 4;
  }

  // Comments (0–7) — signals discussion / usefulness
  score += Math.min(Math.log10(Math.max(comments, 1)) / 2.5, 1) * 7;

  // Channel subscribers (0–6) — authority / production quality proxy
  if (subs >= 10_000) score += 6;
  else if (subs >= 1_000) score += Math.min(Math.log10(subs) / 4, 1) * 6;
  else if (subs >= 100) score += 2;

  // View velocity (0–4)
  score += Math.min(Math.log10(Math.max(views / ageDays, 10)) / 5, 1) * 4;

  return Math.min(score, 25);
}

// ── Composite scorer (0–100) ──────────────────────────────────────────────────

function scoreVideo(item: ScoredItem, professionId: string): number {
  if (!isWithinRecencyWindow(item.publishedAt)) return -1;
  if (!passesRelevanceGate(item, professionId)) return -1;

  const title       = item.title.toLowerCase();
  const description = extractDescription(item.summary).toLowerCase();
  const fullText    = `${title} ${description}`;
  const anchors     = buildProfessionAnchors(professionId);

  // ── AI relevance (0–35) ──────────────────────────────────────────────────
  let aiScore = 0;
  for (const term of STRONG_AI_TERMS) {
    if (!fullText.includes(term)) continue;
    aiScore += title.includes(term) ? 8 : 4;
    if (aiScore >= 35) break;
  }
  if (aiScore < 20) {
    for (const signal of getAISignalTerms(professionId)) {
      const sig = signal.toLowerCase();
      if (sig.length <= 3) {
        if (title.includes(sig)) aiScore += 3;
        continue;
      }
      if (fullText.includes(sig)) {
        aiScore += title.includes(sig) ? 6 : 3;
      }
      if (aiScore >= 35) break;
    }
  }
  aiScore = Math.min(aiScore, 35);

  // ── Profession relevance (0–35) — description weighted heavily ───────────
  let profScore = 0;
  let descAnchorHits = 0;
  for (const a of anchors) {
    if (a.length < 4) continue;
    if (description.includes(a)) descAnchorHits++;
    if (title.includes(a)) profScore += 10;
    else if (description.includes(a)) profScore += 7;
    if (profScore >= 28) break;
  }
  if (descAnchorHits >= 3) profScore += 7;
  profScore = Math.min(profScore, 35);

  // Boost profession-native channel uploads with real profession context
  if (item._nativeChannel && profScore >= 6) {
    profScore = Math.min(profScore + 10, 35);
  }

  // Must have meaningful signals in both dimensions
  if (!item._fromCuratedChannel && (aiScore < 6 || profScore < 6)) return -1;
  if (item._fromCuratedChannel && item._nativeChannel && aiScore < 3 && profScore < 8) return -1;
  if (item._fromCuratedChannel && !item._nativeChannel && (aiScore < 6 || profScore < 8)) return -1;

  // Generic AI news channels need strong profession relevance
  if (item._genericChannel && profScore < 12) return -1;

  // ── Quality (0–25) ─────────────────────────────────────────────────────
  const qualScore = qualityScore(item);

  // ── Recency (0–5) ────────────────────────────────────────────────────────
  let rec = 1;
  try {
    const d = (Date.now() - new Date(item.publishedAt).getTime()) / 86400000;
    if      (d <= 7)   rec = 5;
    else if (d <= 30)  rec = 4;
    else if (d <= 90)  rec = 3;
    else if (d <= 180) rec = 2;
  } catch { rec = 2; }

  let total = aiScore + profScore + qualScore + rec;
  if (item._genericChannel) total -= 12;

  return total;
}

// ── Pool builder — min 8, strict relevance never waived ───────────────────────

function buildVideoPool(
  scored: { item: ScoredItem; score: number }[],
  minCount: number,
  maxCount: number = MAX_VIDEOS,
): { item: ScoredItem; score: number }[] {
  const passing = scored.filter(({ score }) => score >= 0);
  if (!passing.length) return [];

  const tiers = [48, 42, 38, 34];
  for (const floor of tiers) {
    const pool = passing.filter(({ score }) => score >= floor);
    if (pool.length >= minCount) {
      return pool
        .sort((a, b) => b.score - a.score)
        .slice(0, maxCount);
    }
  }

  return passing
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(minCount, Math.min(maxCount, passing.length)));
}

/** Limit generic AI news channels so profession-native sources dominate the feed */
function capGenericChannels(
  pool: { item: ScoredItem; score: number }[],
  maxGeneric: number,
  minCount: number,
): { item: ScoredItem; score: number }[] {
  const primary: { item: ScoredItem; score: number }[] = [];
  const generic: { item: ScoredItem; score: number }[] = [];

  for (const entry of pool) {
    if (entry.item._genericChannel) generic.push(entry);
    else primary.push(entry);
  }

  const kept = [
    ...primary,
    ...generic.slice(0, maxGeneric),
  ];

  if (kept.length >= minCount) return kept;

  // Fill remaining slots from generic backlog if needed
  const used = new Set(kept.map((e) => e.item.url));
  for (const entry of generic.slice(maxGeneric)) {
    if (kept.length >= minCount) break;
    if (used.has(entry.item.url)) continue;
    kept.push(entry);
    used.add(entry.item.url);
  }

  return kept;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const youtubeProvider: FeedProvider = {
  name: "YouTube",

  async fetch(industry, _contentType, limit) {
    const key    = resolveIndustryKey(industry);
    const apiKey = process.env.YOUTUBE_API_KEY;
    const profLabel = getProfession(key)?.label ?? key.replace(/-/g, " ");

    if (!apiKey) {
      console.warn("[yt] No YOUTUBE_API_KEY set — returning empty video feed");
      return [];
    }

    const channels = mergeProfessionChannels(key);
    const nativeIds = getNativeChannelIds(key);

    // Always fetch curated channel uploads first (low quota, works when Search quota is exhausted)
    const channelItems = await fetchCuratedChannelVideos(channels, apiKey, profLabel, nativeIds);

    const allQueries = buildVideoQueries(key);
    const regular    = allQueries.filter((q) => !q.endsWith(" shorts")).slice(0, 5);
    const shorts     = allQueries.filter((q) =>  q.endsWith(" shorts")).slice(0, 3);

    let searchItems: ScoredItem[] = [];
    let quotaHit = false;

    const searchResults = await Promise.allSettled([
      ...regular.map((q) => searchYouTubeApi(q, apiKey, nativeIds, { maxResults: 20, shorts: false })),
      ...shorts.map( (q) => searchYouTubeApi(q.replace(/ shorts$/, ""), apiKey, nativeIds, { maxResults: 15, shorts: true })),
    ]);

    for (const r of searchResults) {
      if (r.status === "fulfilled") {
        if (r.value.quotaExceeded) quotaHit = true;
        else searchItems.push(...r.value.items);
      }
    }

    const all = deduplicateVideos([...searchItems, ...channelItems])
      .filter((item) => isWithinRecencyWindow(item.publishedAt)) as ScoredItem[];

    const scored = all
      .map((item) => ({ item, score: scoreVideo(item, key) }))
      .sort((a, b) => b.score - a.score);

    const pool = capGenericChannels(
      buildVideoPool(scored, MIN_VIDEOS, MAX_VIDEOS),
      MAX_GENERIC_VIDEOS,
      MIN_VIDEOS,
    );
    const ordered = sortNewestFirst(
      pool.map(({ item, score }) => ({ ...item, score })),
    );

    const sources = [...new Set(ordered.map((v) => v.source))];
    console.log(
      `[yt] key=${key} search=${searchItems.length} channels=${channelItems.length} quotaExceeded=${quotaHit} within${MAX_AGE_DAYS}d=${all.length} relevant=${scored.filter((s) => s.score >= 0).length} returning=${ordered.length} sources=${sources.slice(0, 5).join("; ")}`,
    );

    return ordered
      .slice(0, MAX_VIDEOS)
      .map((entry) => {
        const item = entry as ScoredItem;
        const {
          _viewCount, _likeCount, _commentCount, _subscriberCount, _channelId,
          _fromCuratedChannel, _nativeChannel, _genericChannel, score: _score, ...clean
        } = item;
        void _viewCount; void _likeCount; void _commentCount; void _subscriberCount;
        void _channelId; void _fromCuratedChannel; void _nativeChannel; void _genericChannel; void _score;
        return { ...clean, industry: key };
      });
  },
};
