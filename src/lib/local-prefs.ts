// Lightweight local-only preferences (no auth required).
// All reads/writes are guarded for SSR safety.
import type { FeedStory } from "@/lib/client-rss";
import { withStableStoryId } from "@/lib/story-id";

const INTERESTS_KEY = "vai.interests";
const CONTENT_KEY = "vai.content_types";
const PROFESSION_KEY = "vai.profession";
const ONBOARDED_KEY = "vai.onboarded";
const SAVED_KEY = "vai.saved";
const SAVED_STORIES_KEY = "vai.saved_stories";
const LAST_REFRESH_SIG_KEY = "vai.last_refresh_sig";
const WELCOME_LOADER_KEY = "vai.show_welcome_loader";

export function getLastRefreshSig(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem(LAST_REFRESH_SIG_KEY) ?? "";
}

export function setLastRefreshSig(sig: string) {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_REFRESH_SIG_KEY, sig);
}

export function getProfession(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem(PROFESSION_KEY) ?? "";
}

export function setProfession(p: string) {
  if (!isBrowser()) return;
  localStorage.setItem(PROFESSION_KEY, p);
}

export function getContentTypes(): string[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(CONTENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setContentTypes(list: string[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CONTENT_KEY, JSON.stringify(list));
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getInterests(): string[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(INTERESTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setInterests(list: string[]) {
  if (!isBrowser()) return;
  localStorage.setItem(INTERESTS_KEY, JSON.stringify(list));
}

export function isOnboarded(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(ONBOARDED_KEY) === "1";
}

export function setOnboarded() {
  if (!isBrowser()) return;
  localStorage.setItem(ONBOARDED_KEY, "1");
}

function normalizeSavedStories(stories: FeedStory[]): FeedStory[] {
  const byId = new Map<string, FeedStory>();
  for (const raw of stories) {
    if (!raw?.id || !raw.source_url || !raw.content_type) continue;
    try {
      const story = withStableStoryId(raw);
      byId.set(story.id, story);
    } catch {
      // Skip corrupt legacy bookmark entries
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}

function persistSavedStories(stories: FeedStory[]) {
  if (!isBrowser()) return;
  const normalized = normalizeSavedStories(stories);
  localStorage.setItem(SAVED_STORIES_KEY, JSON.stringify(normalized));
  localStorage.setItem(SAVED_KEY, JSON.stringify(normalized.map((s) => s.id)));
}

export function getSavedStories(): FeedStory[] {
  if (!isBrowser()) return [];
  try {
    const stories: FeedStory[] = JSON.parse(localStorage.getItem(SAVED_STORIES_KEY) ?? "[]");
    const normalized = normalizeSavedStories(stories);
    if (JSON.stringify(normalized) !== JSON.stringify(stories)) {
      persistSavedStories(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

/** IDs are always derived from saved story metadata so the two never drift apart. */
export function getSavedIds(): Set<string> {
  return new Set(getSavedStories().map((s) => s.id));
}

export function toggleSavedId(id: string, story?: FeedStory): boolean {
  if (!isBrowser()) return false;
  const stories = getSavedStories();
  const stableId = story ? withStableStoryId(story).id : id;
  const exists = stories.some(
    (s) => s.id === stableId || (story != null && s.source_url === story.source_url),
  );
  const next = !exists;

  if (next) {
    if (!story) return false;
    persistSavedStories([withStableStoryId(story), ...stories]);
  } else {
    persistSavedStories(
      stories.filter(
        (s) => s.id !== stableId && !(story != null && s.source_url === story.source_url),
      ),
    );
  }
  return next;
}

/** Merge cloud + local bookmarks (union by id). Cloud metadata wins on conflicts. */
export function mergeSavedStories(incoming: FeedStory[]): FeedStory[] {
  if (!isBrowser()) return normalizeSavedStories(incoming);
  const merged = normalizeSavedStories([...getSavedStories(), ...incoming]);
  persistSavedStories(merged);
  return merged;
}

export function hydrateSavedStories(stories: FeedStory[]) {
  mergeSavedStories(stories);
}

export function clearPreferences() {
  if (!isBrowser()) return;
  [INTERESTS_KEY, CONTENT_KEY, PROFESSION_KEY, ONBOARDED_KEY, SAVED_KEY, SAVED_STORIES_KEY, LAST_REFRESH_SIG_KEY].forEach(
    (k) => localStorage.removeItem(k),
  );
  sessionStorage.removeItem(WELCOME_LOADER_KEY);
}

/** Show the onboarding-complete welcome loader on the next feed visit. */
export function setShowWelcomeLoader() {
  if (!isBrowser()) return;
  sessionStorage.setItem(WELCOME_LOADER_KEY, "1");
}

export function consumeShowWelcomeLoader(): boolean {
  if (!isBrowser()) return false;
  const show = sessionStorage.getItem(WELCOME_LOADER_KEY) === "1";
  if (show) sessionStorage.removeItem(WELCOME_LOADER_KEY);
  return show;
}
