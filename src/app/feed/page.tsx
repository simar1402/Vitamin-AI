"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LiveStoryCard,
  LiveStoryCardSkeleton,
} from "@/components/feed/live-story-card";
import { useAuth } from "@/providers/auth-provider";
import { useUserPrefs } from "@/providers/user-prefs-provider";
import {
  getProfession,
  getContentTypes,
  setContentTypes as saveContentTypes,
  setProfession as saveProfession,
  setOnboarded,
  toggleSavedId,
  getSavedIds,
  consumeShowWelcomeLoader,
} from "@/lib/local-prefs";
import { FeedSidebar } from "@/components/layout/feed-sidebar";
import { ReturningUserLoading } from "@/components/layout/returning-user-loading";
import { AppLoader } from "@/components/layout/app-loader";
import { getDisplayNameFromUser, professionArticle } from "@/lib/user-display-name";
import { PROFESSIONS } from "@/lib/providers/profession-config";
import { FeedTabButton } from "@/components/feed/feed-tab-button";
import {
  ALL_TYPES,
  filterStoriesByTab,
  getAvailableTabs,
  type FeedTab,
} from "@/lib/feed-tabs";
import type { FeedStory } from "@/lib/client-rss";
import { withStableStoryId } from "@/lib/story-id";
import { isProfileComplete } from "@/lib/user-prefs-sync";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FeedPage() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { ready: prefsReady, profile, saveProfile, syncBookmark } = useUserPrefs();
  const [profession, setProfessionState] = useState<string>("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>("read");
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(false);
  const fetchRef = useRef(0);

  useEffect(() => {
    setShowWelcomeLoader(consumeShowWelcomeLoader());
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    const p = getProfession();
    const t = getContentTypes();
    setSavedIds(getSavedIds());
    const types = t.length > 0 ? t : [...ALL_TYPES];
    if (p) {
      setProfessionState(p);
      setContentTypes(types);
      const tabs = getAvailableTabs(types);
      setActiveTab(tabs[0]);
    }
    setPrefsLoaded(true);
  }, [prefsReady]);

  useEffect(() => {
    if (!prefsReady || !user) return;
    if (!isProfileComplete(profile)) {
      router.replace("/onboarding");
    }
  }, [prefsReady, user, profile, router]);

  const doFetch = useCallback(async (prof: string, types: string[], bustCache = false) => {
    if (!prof) { setStories([]); setFetchError(null); return; }
    const token = ++fetchRef.current;
    setLoading(true);
    setFetchError(null);
    const fetchTypes = types.length > 0 ? types : [...ALL_TYPES];
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession: prof, contentTypes: fetchTypes, bustCache }),
      });
      if (fetchRef.current !== token) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { stories: FeedStory[]; count: number };
      setStories(data.stories ?? []);
      saveContentTypes(types);
      setOnboarded();
      if (user) {
        void saveProfile({ profession: prof, contentTypes: types, onboarded: true });
      }
    } catch (e) {
      if (fetchRef.current !== token) return;
      setFetchError(e instanceof Error ? e.message : "Could not load stories.");
      setStories([]);
    } finally {
      if (fetchRef.current === token) setLoading(false);
    }
  }, [user, saveProfile]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!profession || !prefsLoaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doFetch(profession, contentTypes), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [profession, contentTypes, doFetch, prefsLoaded]);

  const handleChangeProfession = (id: string) => {
    setProfessionState(id);
    saveProfession(id);
    setStories([]);
    if (user) {
      void saveProfile({ profession: id, contentTypes, onboarded: true });
    }
  };

  const availableTabs = getAvailableTabs(contentTypes);

  // Ensure activeTab is always on an available tab
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] ?? "read");
    }
  }, [availableTabs, activeTab]);

  const readStories  = filterStoriesByTab(stories, "read");
  const watchStories = filterStoriesByTab(stories, "watch");
  const profConfig   = PROFESSIONS.find((p) => p.id === profession);
  const displayName  = getDisplayNameFromUser(user, profile?.fullName);

  const handleSave = (id: string, story: FeedStory) => {
    const stable = withStableStoryId(story);
    const next = toggleSavedId(stable.id, stable);
    setSavedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(stable.id);
      else s.delete(stable.id);
      return s;
    });
    void syncBookmark(stable, next);
  };

  if (!prefsReady || !prefsLoaded) {
    return <AppLoader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <FeedSidebar
        profession={profession}
        loading={loading}
        user={user}
        onRefresh={() => doFetch(profession, contentTypes, true)}
        onSignOut={signOut}
        onChangeProfession={handleChangeProfession}
      />

      <div className="ml-56 flex flex-1 flex-col min-w-0">
        <main className="flex-1 px-8 py-10">
          {!profession ? (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <p className="mb-3 text-4xl">🌿</p>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground/80">
                No profession selected
              </h2>
              <p className="mb-6 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                Pick your profession in Settings to see AI developments relevant to your work.
              </p>
              <Button className="rounded-lg text-sm font-medium" asChild>
                <Link href="/onboarding">Get started</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Page title */}
              <div>
                <h1 className="text-display-section text-2xl leading-snug">
                  Hello {displayName}, it&apos;s a great time to be {profConfig ? `${professionArticle(profConfig.label)} ${profConfig.label}` : "here"}
                </h1>
              </div>

              {fetchError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                  {fetchError}
                </div>
              )}

              {/* Tab bar */}
              {!loading || stories.length > 0 ? (
                <div className="flex items-center gap-1 border-b border-border">
                  {availableTabs.map((tab) => (
                    <FeedTabButton
                      key={tab}
                      tab={tab}
                      active={activeTab === tab}
                      count={tab === "read" ? readStories.length : watchStories.length}
                      loading={loading}
                      onClick={() => setActiveTab(tab)}
                    />
                  ))}
                </div>
              ) : null}

              {/* Content */}
              {loading && stories.length === 0 ? (
                showWelcomeLoader ? (
                  <ReturningUserLoading
                    user={user}
                    storedFullName={profile?.fullName}
                    className="flex flex-col items-center justify-center gap-6 py-32 text-center"
                  />
                ) : (
                  <AppLoader />
                )
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "read" ? (
                      <StoryGrid
                        stories={readStories}
                        loading={loading}
                        emptyIcon={<BookOpen className="h-7 w-7 text-muted-foreground/40" />}
                        emptyLabel="No reading content found"
                        savedIds={savedIds}
                        onSave={handleSave}
                        onRetry={() => doFetch(profession, contentTypes, true)}
                      />
                    ) : (
                      <StoryGrid
                        stories={watchStories}
                        loading={loading}
                        emptyIcon={<Play className="h-7 w-7 text-muted-foreground/40" />}
                        emptyLabel="No videos found"
                        savedIds={savedIds}
                        onSave={handleSave}
                        onRetry={() => doFetch(profession, contentTypes, true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Story grid ────────────────────────────────────────────────────────────────

function StoryGrid({
  stories, loading, emptyIcon, emptyLabel, savedIds, onSave, onRetry,
}: {
  stories: FeedStory[];
  loading: boolean;
  emptyIcon: React.ReactNode;
  emptyLabel: string;
  savedIds: Set<string>;
  onSave: (id: string, story: FeedStory) => void;
  onRetry: () => void;
}) {
  if (loading && stories.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <LiveStoryCardSkeleton key={i} />)}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
        <div className="text-center">
          {emptyIcon}
          <p className="mt-2.5 text-[13px] text-muted-foreground">{emptyLabel}</p>
          <button
            onClick={onRetry}
            className="mx-auto mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground/70"
          >
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {stories.map((story, i) => (
          <LiveStoryCard
            key={story.id}
            story={story}
            index={i}
            saved={savedIds.has(withStableStoryId(story).id)}
            onSaveToggle={(id) => onSave(id, story)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
