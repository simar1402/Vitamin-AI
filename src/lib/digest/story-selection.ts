import { getSupabaseAdmin } from "@/integrations/supabase/server";
import type { FeedStory } from "@/lib/client-rss";
import { fetchFeed } from "@/lib/providers";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { DigestContent, DigestStory } from "./types";

const ARTICLE_TYPES = ["Articles", "News"] as const;

function truncateSummary(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function toDigestStory(row: {
  headline: string;
  summary: string;
  source_url: string;
}): DigestStory {
  return {
    headline: row.headline,
    summary: truncateSummary(row.summary || row.headline),
    sourceUrl: row.source_url,
  };
}

function storyToRow(story: FeedStory, profession: string): TablesInsert<"stories"> {
  return {
    id: story.id,
    headline: story.headline,
    summary: story.summary ?? "",
    image_url: story.image_url,
    source_url: story.source_url,
    source_name: story.source_name ?? null,
    published_at: story.published_at,
    content_type: story.content_type,
    category: story.category ?? story.content_type,
    tags: [profession],
    why_it_matters: null,
  };
}

/** Refresh profession-tagged stories in Supabase from the live feed pipeline. */
export async function syncStoriesForProfession(profession: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  const stories = await fetchFeed({
    profession,
    interests: [],
    contentTypes: ["News", "Articles", "Videos"],
  });

  if (stories.length === 0) {
    console.warn(`[digest] No stories fetched for profession=${profession}`);
    return 0;
  }

  const rows = stories.map((story) => storyToRow(story, profession));
  const { error } = await supabase.from("stories").upsert(rows, { onConflict: "id" });

  if (error) {
    console.error(`[digest] Failed to sync stories for ${profession}:`, error.message);
    throw new Error(`Story sync failed for ${profession}: ${error.message}`);
  }

  console.info(`[digest] Synced ${rows.length} stories for profession=${profession}`);
  return rows.length;
}

/** Pick 1 best article and 1 best video from the stories table for a profession. */
export async function selectDigestStories(profession: string): Promise<DigestContent> {
  await syncStoriesForProfession(profession);

  const supabase = getSupabaseAdmin();

  const { data: readCandidates, error: readError } = await supabase
    .from("stories")
    .select("headline, summary, source_url, content_type, published_at")
    .contains("tags", [profession])
    .in("content_type", [...ARTICLE_TYPES])
    .order("published_at", { ascending: false })
    .limit(20);

  if (readError) {
    throw new Error(`Failed to load article candidates: ${readError.message}`);
  }

  const articleRow =
    readCandidates?.find((row) => row.content_type === "Articles") ??
    readCandidates?.[0] ??
    null;

  const { data: videoCandidates, error: videoError } = await supabase
    .from("stories")
    .select("headline, summary, source_url, content_type, published_at")
    .contains("tags", [profession])
    .eq("content_type", "Videos")
    .order("published_at", { ascending: false })
    .limit(1);

  if (videoError) {
    throw new Error(`Failed to load video candidates: ${videoError.message}`);
  }

  const videoRow = videoCandidates?.[0] ?? null;

  console.info(
    `[digest] Selected for ${profession}: article=${articleRow?.headline ?? "none"} video=${videoRow?.headline ?? "none"}`,
  );

  return {
    article: articleRow ? toDigestStory(articleRow) : null,
    video: videoRow ? toDigestStory(videoRow) : null,
  };
}
