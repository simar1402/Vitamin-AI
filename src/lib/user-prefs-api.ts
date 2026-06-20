import type { FeedStory } from "@/lib/client-rss";
import type { UserProfilePrefs } from "@/lib/user-prefs-types";

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    const body = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      console.error("[user-prefs-api]", body.error ?? res.status);
      return null;
    }
    return body;
  } catch (err) {
    console.error("[user-prefs-api] parse failed:", err);
    return null;
  }
}

export async function fetchPrefsFromApi(): Promise<UserProfilePrefs | null> {
  try {
    const res = await fetchWithTimeout("/api/user/prefs", { method: "GET", credentials: "include" });
    if (res.status === 401) return null;
    const data = await parseJson<{ profile: UserProfilePrefs | null }>(res);
    return data?.profile ?? null;
  } catch (err) {
    console.error("[user-prefs-api] fetch prefs failed:", err);
    return null;
  }
}

export async function savePrefsToApi(
  prefs: UserProfilePrefs,
  fullName?: string | null,
): Promise<boolean> {
  try {
    const res = await fetch("/api/user/prefs", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...prefs, fullName }),
    });
    if (res.status === 401) return false;
    const data = await parseJson<{ ok: true }>(res);
    return data?.ok === true;
  } catch (err) {
    console.error("[user-prefs-api] save prefs failed:", err);
    return false;
  }
}

export async function fetchBookmarksFromApi(): Promise<FeedStory[]> {
  try {
    const res = await fetchWithTimeout("/api/user/bookmarks", { method: "GET", credentials: "include" });
    if (res.status === 401) return [];
    const data = await parseJson<{ bookmarks: FeedStory[] }>(res);
    return data?.bookmarks ?? [];
  } catch (err) {
    console.error("[user-prefs-api] fetch bookmarks failed:", err);
    return [];
  }
}

export async function syncBookmarkViaApi(story: FeedStory, saved: boolean): Promise<boolean> {
  try {
    const res = await fetch("/api/user/bookmarks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story, saved }),
    });
    if (res.status === 401) return false;
    const data = await parseJson<{ ok: true }>(res);
    return data?.ok === true;
  } catch (err) {
    console.error("[user-prefs-api] sync bookmark failed:", err);
    return false;
  }
}
