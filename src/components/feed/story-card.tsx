"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { FeedStory } from "@/lib/client-rss";
import { toggleSavedId } from "@/lib/local-prefs";
import { safeStoryUrl } from "@/lib/external-links";
import { cn } from "@/lib/utils";

interface StoryCardProps {
  story: FeedStory;
  saved?: boolean;
  index?: number;
}

export function StoryCard({ story, saved: initialSaved = false, index = 0 }: StoryCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const openUrl = safeStoryUrl(story);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleSavedId(story.id, story));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.24), ease: "easeOut" }}
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
              />
            </AspectRatio>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4">
          {story.category && (
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {story.category}
            </span>
          )}
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
            onClick={toggleSave}
            aria-label="Save"
            className={cn(
              "relative z-20 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent",
              saved ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
            )}
          >
            {saved
              ? <BookmarkCheck className="h-4 w-4" />
              : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function StoryCardSkeleton() {
  return (
    <div className="story-card flex flex-col overflow-hidden">
      <div className="aspect-video w-full skeleton-shimmer" />
      <div className="space-y-2.5 p-4">
        <div className="h-2 w-16 rounded-full skeleton-shimmer" />
        <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
        <div className="h-3 w-full rounded-md skeleton-shimmer" />
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="h-2 w-16 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
