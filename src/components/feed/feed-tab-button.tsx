"use client";

import { BookOpen, Play } from "lucide-react";
import type { FeedTab } from "@/lib/feed-tabs";
import { cn } from "@/lib/utils";

export function FeedTabButton({
  tab,
  active,
  count,
  loading = false,
  onClick,
}: {
  tab: FeedTab;
  active: boolean;
  count: number;
  loading?: boolean;
  onClick: () => void;
}) {
  const Icon = tab === "read" ? BookOpen : Play;
  const label = tab === "read" ? "Read" : "Watch";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-all border-b-2 -mb-px",
        active
          ? "border-foreground/70 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground/70",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {!loading && count > 0 && (
        <span
          className={cn(
            "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-accent text-foreground/70" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
