import type { Story } from "@/lib/types";
import { isWrapperOrSearchUrl } from "@/lib/providers/text";

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function hostnameOf(url: string): string {
  return parseUrl(url)?.hostname.replace(/^www\./, "").toLowerCase() ?? "";
}

/** @deprecated Use isWrapperOrSearchUrl — kept for refresh route compatibility */
export function isKnownBlockedUrl(url: string): boolean {
  return isWrapperOrSearchUrl(url);
}

export function webSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Returns the direct article URL. Never substitutes a Google search link.
 * Wrapper URLs should be filtered out upstream in providers.
 */
export function safeStoryUrl(
  story: Pick<Story, "headline" | "source_name" | "source_url"> & {
    content_type?: string;
  },
) {
  if (!story.source_url || isWrapperOrSearchUrl(story.source_url)) {
    return "#";
  }
  return story.source_url;
}

export { hostnameOf };
