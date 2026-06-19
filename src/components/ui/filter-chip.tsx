"use client";

import * as React from "react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Pill-shaped toggle chip for filters and multi-select interests.
 * Built on shadcn Toggle (Radix).
 */
export function FilterChip({
  pressed,
  onPressedChange,
  children,
  className,
  size = "sm",
}: FilterChipProps) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      className={cn(
        "rounded-full font-semibold border-border/70 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary hover:data-[state=off]:border-primary/40",
        size === "sm" && "h-8 px-3 text-xs min-w-0",
        className,
      )}
    >
      {children}
    </Toggle>
  );
}

interface FilterChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterChipGroup({ children, className }: FilterChipGroupProps) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}
