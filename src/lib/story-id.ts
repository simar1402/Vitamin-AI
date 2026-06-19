import type { FeedStory } from "@/lib/client-rss";

export type StoryContentType = FeedStory["content_type"];

/** Canonical URL for stable identity (YouTube → video id, strip hash). */
export function normalizeStoryUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return `youtube:${id}`;
    }

    if (host.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `youtube:${id}`;
      const shortId = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/)?.[1];
      if (shortId) return `youtube:${shortId}`;
    }

    u.hash = "";
    return u.toString();
  } catch {
    return url.trim();
  }
}

/** FNV-1a 64-bit — isomorphic (works in browser + Node). */
function hashUrlKey(key: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c;
    h2 = Math.imul(h2, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

/** Stable, collision-resistant id derived from the canonical URL. */
export function createStoryId(
  url: string | null | undefined,
  contentType: StoryContentType,
): string {
  const normalized = normalizeStoryUrl(url);
  if (!normalized) {
    return `unknown-${hashUrlKey(String(url ?? contentType))}`;
  }

  if (normalized.startsWith("youtube:")) {
    return `vid-${normalized.slice("youtube:".length)}`;
  }

  const prefix =
    contentType === "Videos" ? "vid" : contentType === "News" ? "news" : "art";
  return `${prefix}-${hashUrlKey(normalized)}`;
}

/** Re-key a story so id always matches its URL (handles legacy truncated ids). */
export function withStableStoryId<T extends Pick<FeedStory, "id" | "source_url" | "content_type">>(
  story: T,
): T {
  const stableId = createStoryId(story.source_url, story.content_type);
  return story.id === stableId ? story : { ...story, id: stableId };
}
