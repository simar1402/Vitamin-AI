"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookOpen, Play, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { FeedSidebar } from "@/components/layout/feed-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FeedTabButton } from "@/components/feed/feed-tab-button";
import { useAuth } from "@/providers/auth-provider";
import { useUserPrefs } from "@/providers/user-prefs-provider";
import { AppLoader } from "@/components/layout/app-loader";
import {
  getProfession,
  getSavedStories,
  toggleSavedId,
  setProfession as saveProfession,
} from "@/lib/local-prefs";
import {
  filterStoriesByTab,
  getAvailableTabsFromStories,
  type FeedTab,
} from "@/lib/feed-tabs";
import { safeStoryUrl } from "@/lib/external-links";
import type { FeedStory } from "@/lib/client-rss";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function BookmarksPage() {
  const { signOut, user } = useAuth();
  const { ready: prefsReady, syncBookmark } = useUserPrefs();
  const router = useRouter();
  const pathname = usePathname();
  const [profession, setProfessionState] = useState("");
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [activeTab, setActiveTab] = useState<FeedTab>("read");

  const refreshStories = useCallback(() => {
    setStories(getSavedStories());
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    setProfessionState(getProfession());
    refreshStories();
  }, [prefsReady, refreshStories]);

  useEffect(() => {
    if (!prefsReady || pathname !== "/saved") return;
    refreshStories();
  }, [prefsReady, pathname, refreshStories]);

  useEffect(() => {
    if (!prefsReady) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshStories();
    };
    window.addEventListener("focus", refreshStories);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshStories);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [prefsReady, refreshStories]);

  const availableTabs = getAvailableTabsFromStories(stories);
  const readStories = filterStoriesByTab(stories, "read");
  const watchStories = filterStoriesByTab(stories, "watch");
  const visibleStories = activeTab === "read" ? readStories : watchStories;

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] ?? "read");
    }
  }, [availableTabs, activeTab]);

  const handleRemove = (id: string, story: FeedStory) => {
    toggleSavedId(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    void syncBookmark(story, false);
  };

  const handleChangeProfession = (id: string) => {
    saveProfession(id);
    setProfessionState(id);
    router.push("/feed");
  };

  if (!prefsReady) {
    return <AppLoader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <FeedSidebar
        profession={profession}
        loading={false}
        user={user}
        onRefresh={() => router.push("/feed")}
        onSignOut={signOut}
        onChangeProfession={handleChangeProfession}
      />

      <MobileNav />
      <div className="flex flex-1 flex-col min-w-0 lg:ml-56">
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:py-8 lg:px-8 lg:py-10 lg:pb-10">
          <div className="mb-8">
            <p className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
              Your collection
            </p>
            <h1 className="text-display-section text-2xl">Bookmarks</h1>
            {stories.length > 0 && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {stories.length} saved {stories.length === 1 ? "item" : "items"}
              </p>
            )}
          </div>

          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <Bookmark className="mb-4 h-10 w-10 text-muted-foreground/50" />
              <h2 className="mb-2 text-[15px] font-semibold tracking-tight text-foreground/70">
                No bookmarks yet
              </h2>
              <p className="mb-6 max-w-xs text-[13px] text-muted-foreground leading-relaxed">
                Hit the bookmark icon on any story to save it here for later.
              </p>
              <Link
                href="/feed"
                className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                Back to feed
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {availableTabs.length > 1 && (
                <div className="flex items-center gap-1 border-b border-border">
                  {availableTabs.map((tab) => (
                    <FeedTabButton
                      key={tab}
                      tab={tab}
                      active={activeTab === tab}
                      count={tab === "read" ? readStories.length : watchStories.length}
                      onClick={() => setActiveTab(tab)}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {visibleStories.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
                      <div className="text-center">
                        {activeTab === "read" ? (
                          <BookOpen className="mx-auto h-7 w-7 text-muted-foreground/40" />
                        ) : (
                          <Play className="mx-auto h-7 w-7 text-muted-foreground/40" />
                        )}
                        <p className="mt-2.5 text-[13px] text-muted-foreground">
                          No {activeTab === "read" ? "reading" : "video"} bookmarks yet
                        </p>
                      </div>
                    </div>
                  ) : (
                    <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <AnimatePresence>
                        {visibleStories.map((story, i) => (
                          <BookmarkCard
                            key={story.id}
                            story={story}
                            index={i}
                            onRemove={handleRemove}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Bookmark card ─────────────────────────────────────────────────────────────

function BookmarkCard({
  story,
  index,
  onRemove,
}: {
  story: FeedStory;
  index: number;
  onRemove: (id: string, story: FeedStory) => void;
}) {
  const openUrl = safeStoryUrl(story);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      className="h-full"
    >
      <div className="story-card group relative flex h-full flex-col overflow-hidden">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={story.headline}
          className="absolute inset-0 z-10 rounded-xl"
        />

        {story.image_url && (
          <div className="overflow-hidden border-b border-border">
            <AspectRatio ratio={16 / 9}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.image_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </AspectRatio>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-foreground">
            {story.headline}
          </h3>
          {story.summary && (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
              {story.summary}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(story.id, story);
            }}
            aria-label="Remove bookmark"
            className="relative z-20 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
