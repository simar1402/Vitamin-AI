/**
 * Feed orchestrator — public entry point for the /api/feed route.
 *
 * Given a profession (or legacy interests list) and content types it:
 *   1. Checks the in-memory cache
 *   2. Calls providers in parallel
 *   3. Normalises to FeedItem
 *   4. Ranks, filters, deduplicates
 *   5. Converts to FeedStory (UI shape) and returns
 *   6. Stores in cache
 */

import { youtubeProvider } from "./youtubeProvider";
import { googleNewsProvider } from "./googleNewsProvider";
import { mediumProvider } from "./mediumProvider";
import { professionToIndustryKey } from "./profession-config";
import { rankAndFilter, rankVideos, sortNewestFirst } from "./ranker";
import { getCached, setCached, bustCache } from "./cache";
import type { ContentType, FeedItem } from "./types";
import type { FeedStory } from "@/lib/client-rss";
import { withStableStoryId } from "@/lib/story-id";

export type { ContentType };

const PER_PROVIDER_LIMIT        = 48;
const PER_PROVIDER_LIMIT_VIDEO  = 80; // candidates before YouTube quality pool
const MIN_VIDEOS_PER_FEED       = 8;
const MAX_VIDEOS_PER_FEED       = 16;
const MIN_READ_ITEMS_PER_TYPE   = 12;
const MAX_READ_ITEMS_PER_TYPE   = 24;

function toFeedStory(item: FeedItem): FeedStory {
  return withStableStoryId({
    id: item.id,
    headline: item.title,
    summary: item.summary,
    image_url: item.thumbnail,
    source_url: item.url,
    source_name: item.source,
    published_at: item.publishedAt,
    content_type: item.contentType,
    category: item.contentType,
    why_it_matters: null,
  });
}

interface FetchOptions {
  /**
   * Preferred: pass a profession ID (e.g. "product-manager").
   * Legacy: pass granular interest strings from the old onboarding flow.
   */
  interests: string[];
  /** Optional explicit profession ID — takes priority over interests */
  profession?: string;
  contentTypes: ContentType[];
  bustCacheFlag?: boolean;
}

/**
 * Map a profession ID or legacy interest string to the provider key.
 * Profession IDs pass through directly (providers know how to handle them).
 */
function resolveProviderKeys(interests: string[], profession?: string): string[] {
  // If a profession ID is provided, use it directly
  if (profession) return [profession];

  // Legacy interest → profession-ID mapping
  const MAP: Record<string, string> = {
    // Design
    Designer:          "product-designer",
    "Product Design":  "product-designer",
    "UX Research":     "product-designer",
    "Fashion Design":  "product-designer",
    Architecture:      "product-designer",
    Design:            "product-designer",
    // Engineering / Dev
    Developer:              "software-engineer",
    "Software Engineering": "software-engineer",
    Hardware:               "software-engineer",
    DevTools:               "software-engineer",
    Automation:             "software-engineer",
    Technology:             "software-engineer",
    Robotics:               "software-engineer",
    // Medical
    Healthcare: "doctor",
    Medical:    "doctor",
    Biotech:    "doctor",
    Pharma:     "doctor",
    "Mental Health": "doctor",
    Genomics:   "doctor",
    Science:    "doctor",
    Biology:    "doctor",
    // Education
    Education:      "teacher",
    Educator:       "teacher",
    EdTech:         "teacher",
    Teaching:       "teacher",
    "Online Learning": "teacher",
    // Legal
    Law:            "lawyer",
    Policy:         "lawyer",
    "AI Regulation": "lawyer",
    Ethics:         "lawyer",
    Privacy:        "lawyer",
    Security:       "lawyer",
    // Entrepreneur / Business
    Founder:        "entrepreneur",
    Startups:       "entrepreneur",
    Business:       "entrepreneur",
    Operations:     "entrepreneur",
    Entrepreneurship: "entrepreneur",
    "Venture Capital": "entrepreneur",
    // Sales
    Sales:          "sales",
    Marketing:      "sales",
    Marketer:       "sales",
    Growth:         "sales",
    // Finance
    Finance:        "entrepreneur", // no dedicated finance profession yet
    Fintech:        "entrepreneur",
    Investing:      "entrepreneur",
    Crypto:         "entrepreneur",
    Banking:        "entrepreneur",
    Insurance:      "sales",
    // Arts
    Art:         "product-designer",
    Photography: "product-designer",
    Film:        "product-designer",
    Music:       "product-designer",
    Writing:     "product-designer",
    // AI
    "Generative AI": "software-engineer",
    LLMs:            "software-engineer",
    Agents:          "software-engineer",
    "Computer Vision": "software-engineer",
    "Voice AI":      "software-engineer",
    // PM
    "Product Manager": "product-manager",
  };

  const keys = interests.map((i) => MAP[i] ?? i);
  return [...new Set(keys)];
}

export async function fetchFeed({
  interests,
  profession,
  contentTypes,
  bustCacheFlag = false,
}: FetchOptions): Promise<FeedStory[]> {
  if (interests.length === 0 && !profession) return [];

  const types: ContentType[] =
    contentTypes.length > 0 ? contentTypes : ["News", "Videos", "Articles"];

  const providerKeys = resolveProviderKeys(interests, profession);

  if (bustCacheFlag) bustCache(providerKeys, types);

  const cached = getCached(providerKeys, types);
  if (cached) {
    const wantsVideos = types.includes("Videos");
    const videoCount = cached.filter((i) => i.contentType === "Videos").length;
    // Auto-refetch when an old cache entry has too few videos (provider was fixed upstream)
    if (!wantsVideos || videoCount >= MIN_VIDEOS_PER_FEED) {
      return cached.map(toFeedStory);
    }
    console.warn(
      `[feed] Stale video cache for ${providerKeys.join(",")}: only ${videoCount} videos — refetching`,
    );
  }

  // ── Parallel provider fetches ──────────────────────────────────────────────
  const tasks: Promise<FeedItem[]>[] = [];

  for (const key of providerKeys) {
    for (const type of types) {
      if (type === "Videos") {
        tasks.push(youtubeProvider.fetch(key, type, PER_PROVIDER_LIMIT_VIDEO).catch(() => []));
      } else if (type === "News") {
        tasks.push(googleNewsProvider.fetch(key, type, PER_PROVIDER_LIMIT).catch(() => []));
      } else if (type === "Articles") {
        tasks.push(mediumProvider.fetch(key, type, PER_PROVIDER_LIMIT).catch(() => []));
      }
    }
  }

  const batches = await Promise.allSettled(tasks);
  const raw = batches.flatMap((b) => (b.status === "fulfilled" ? b.value : []));

  const byType: Record<ContentType, FeedItem[]> = { News: [], Videos: [], Articles: [] };
  for (const item of raw) {
    byType[item.contentType]?.push(item);
  }

  // Use the primary profession key for ranking context
  const primaryKey = profession ?? providerKeys[0] ?? "software-engineer";

  const readItems: FeedItem[] = [];
  const watchItems: FeedItem[] = [];

  for (const type of types) {
    const isVideo = type === "Videos";
    const sorted = (isVideo
      ? rankVideos(byType[type], primaryKey)
      : rankAndFilter(byType[type], primaryKey)
    ).slice(0, isVideo ? MAX_VIDEOS_PER_FEED : MAX_READ_ITEMS_PER_TYPE);

    const minExpected = isVideo ? MIN_VIDEOS_PER_FEED : MIN_READ_ITEMS_PER_TYPE;
    if (sorted.length < minExpected) {
      console.warn(
        `[feed] Low result count for type=${type} profession=${primaryKey}: only ${sorted.length} items`,
      );
    }
    if (isVideo) watchItems.push(...sorted);
    else readItems.push(...sorted);
  }

  const ranked: FeedItem[] = [
    ...sortNewestFirst(readItems),
    ...watchItems,
  ];

  setCached(providerKeys, types, ranked);
  return ranked.map(toFeedStory);
}
