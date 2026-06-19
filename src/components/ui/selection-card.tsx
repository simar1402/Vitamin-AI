"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Large tappable card for onboarding profession / content-type picks */
export function SelectionCard({
  active,
  onClick,
  children,
  className,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl border bg-card p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:shadow-focus-warm focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-[rgba(28,28,28,0.4)] bg-accent"
          : "border-border hover:border-[rgba(28,28,28,0.25)] hover:bg-accent/60",
        className,
      )}
    >
      <span className="text-sm font-normal text-foreground">{children}</span>
      {active && (
        <span
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-inset-button"
          aria-hidden
        >
          <Check className="h-3 w-3 text-primary-foreground" />
        </span>
      )}
    </button>
  );
}
