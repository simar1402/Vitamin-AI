"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FeedStory } from "@/lib/client-rss";
import {
  saveProfilePrefs,
  syncBookmarkToCloud,
  syncUserPrefsFromCloud,
  type UserProfilePrefs,
} from "@/lib/user-prefs-sync";
import { useAuth } from "@/providers/auth-provider";

interface UserPrefsContextValue {
  /** True once initial local/cloud sync has finished for the current session. */
  ready: boolean;
  profile: UserProfilePrefs | null;
  saveProfile: (prefs: UserProfilePrefs) => Promise<void>;
  syncBookmark: (story: FeedStory, saved: boolean) => Promise<void>;
}

const UserPrefsContext = createContext<UserPrefsContextValue | null>(null);

const SYNC_TIMEOUT_MS = 4000;

export function UserPrefsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfilePrefs | null>(null);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      syncedUserId.current = null;
      setProfile(null);
      setReady(true);
      return;
    }

    if (syncedUserId.current === userId) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    const timeout = setTimeout(() => {
      if (cancelled) return;
      console.warn("[user-prefs] sync timed out — continuing with local state");
      syncedUserId.current = userId;
      setReady(true);
    }, SYNC_TIMEOUT_MS);

    (async () => {
      try {
        const fullName =
          user?.user_metadata?.full_name ??
          user?.user_metadata?.name ??
          null;

        const prefs = await syncUserPrefsFromCloud(userId, fullName);
        if (cancelled) return;

        syncedUserId.current = userId;
        setProfile(
          prefs
            ? {
                ...prefs,
                fullName: prefs.fullName ?? fullName,
              }
            : null,
        );
      } catch (err) {
        console.error("[user-prefs] sync failed:", err);
        if (!cancelled) {
          syncedUserId.current = userId;
          setProfile(null);
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [userId, authLoading, user]);

  const saveProfile = useCallback(
    async (prefs: UserProfilePrefs) => {
      const fullName =
        prefs.fullName ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        profile?.fullName ??
        null;
      const next = { ...prefs, fullName };
      setProfile(next);
      if (!user) return;
      await saveProfilePrefs(user.id, next, fullName);
    },
    [user, profile?.fullName],
  );

  const syncBookmark = useCallback(
    async (story: FeedStory, saved: boolean) => {
      if (!user) return;
      await syncBookmarkToCloud(user.id, story, saved);
    },
    [user],
  );

  return (
    <UserPrefsContext.Provider value={{ ready, profile, saveProfile, syncBookmark }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export function useUserPrefs(): UserPrefsContextValue {
  const ctx = useContext(UserPrefsContext);
  if (!ctx) throw new Error("useUserPrefs must be used inside <UserPrefsProvider>");
  return ctx;
}
