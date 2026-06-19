import type { FeedStory } from "@/lib/client-rss";

export type FeedTab = "read" | "watch";

export const READ_TYPES = ["News", "Articles"] as const;
export const WATCH_TYPES = ["Videos"] as const;
export const ALL_TYPES = ["News", "Articles", "Videos"] as const;

/** Derive which tabs are available from content-type strings (prefs or story types). */
export function getAvailableTabs(types: string[]): FeedTab[] {
  const hasRead = types.some((t) => (READ_TYPES as readonly string[]).includes(t));
  const hasWatch = types.some((t) => (WATCH_TYPES as readonly string[]).includes(t));
  const tabs: FeedTab[] = [];
  if (hasRead) tabs.push("read");
  if (hasWatch) tabs.push("watch");
  return tabs.length > 0 ? tabs : ["read", "watch"];
}

export function getAvailableTabsFromStories(stories: FeedStory[]): FeedTab[] {
  return getAvailableTabs(stories.map((s) => s.content_type));
}

export function filterStoriesByTab(stories: FeedStory[], tab: FeedTab): FeedStory[] {
  return tab === "read"
    ? stories.filter((s) => (READ_TYPES as readonly string[]).includes(s.content_type))
    : stories.filter((s) => (WATCH_TYPES as readonly string[]).includes(s.content_type));
}
