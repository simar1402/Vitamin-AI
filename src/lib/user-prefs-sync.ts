import type { FeedStory } from "@/lib/client-rss";
import {
  fetchBookmarksFromApi,
  fetchPrefsFromApi,
  savePrefsToApi,
  syncBookmarkViaApi,
} from "@/lib/user-prefs-api";
import {
  isProfileComplete,
  type UserProfilePrefs,
} from "@/lib/user-prefs-types";
import {
  getContentTypes,
  getProfession,
  getSavedStories,
  isOnboarded,
  mergeSavedStories,
  setContentTypes,
  setOnboarded,
  setProfession,
} from "@/lib/local-prefs";

export type { UserProfilePrefs } from "@/lib/user-prefs-types";
export { isProfileComplete } from "@/lib/user-prefs-types";

/** Pull Supabase prefs into localStorage (server wins when present). */
function applyProfileToLocal(profile: UserProfilePrefs) {
  if (profile.profession) setProfession(profile.profession);
  if (profile.contentTypes.length > 0) setContentTypes(profile.contentTypes);
  if (profile.onboarded) setOnboarded();
}

async function pushLocalBookmarksToCloud(cloudBookmarks: FeedStory[]): Promise<void> {
  const cloudIds = new Set(cloudBookmarks.map((s) => s.id));
  const localOnly = getSavedStories().filter((s) => !cloudIds.has(s.id));
  await Promise.all(localOnly.map((story) => syncBookmarkViaApi(story, true)));
}

/** Push local onboarding state to Supabase when cloud profile is empty. */
async function pushLocalToCloud(fullName?: string | null): Promise<UserProfilePrefs> {
  const local: UserProfilePrefs = {
    profession: getProfession(),
    contentTypes: getContentTypes(),
    onboarded: isOnboarded(),
  };

  if (local.profession || local.contentTypes.length > 0 || local.onboarded) {
    await savePrefsToApi(local, fullName);
  }

  return local;
}

/**
 * On login: load profile + bookmarks from Supabase via API.
 * If cloud is empty but local has data, upload local to cloud.
 */
export async function syncUserPrefsFromCloud(
  _userId: string,
  fullName?: string | null,
): Promise<UserProfilePrefs> {
  const [profile, cloudBookmarks] = await Promise.all([
    fetchPrefsFromApi(),
    fetchBookmarksFromApi(),
  ]);

  mergeSavedStories(cloudBookmarks);
  // Upload local-only bookmarks in background — don't block the login flow
  void pushLocalBookmarksToCloud(cloudBookmarks);

  if (isProfileComplete(profile)) {
    applyProfileToLocal(profile!);
    return profile!;
  }

  const local = await pushLocalToCloud(fullName);
  if (local.profession || local.contentTypes.length > 0) {
    applyProfileToLocal(local);
  }
  return local;
}

export async function saveProfilePrefs(
  _userId: string,
  prefs: UserProfilePrefs,
  fullName?: string | null,
): Promise<void> {
  if (prefs.profession) setProfession(prefs.profession);
  if (prefs.contentTypes.length > 0) setContentTypes(prefs.contentTypes);
  if (prefs.onboarded) setOnboarded();

  const ok = await savePrefsToApi(prefs, fullName);
  if (!ok) {
    throw new Error("Failed to save preferences to cloud");
  }
}

export async function syncBookmarkToCloud(
  _userId: string,
  story: FeedStory,
  saved: boolean,
): Promise<void> {
  await syncBookmarkViaApi(story, saved);
}
