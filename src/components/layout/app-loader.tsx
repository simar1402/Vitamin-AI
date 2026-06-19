"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoaderProps {
  className?: string;
  /** When true, fills the viewport (e.g. initial page load). */
  fullScreen?: boolean;
}

export function AppLoader({ className, fullScreen = false }: AppLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background",
        fullScreen ? "min-h-screen" : "py-32",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
