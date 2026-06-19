"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  children?: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "wide";
  homeHref?: string;
}

export function SiteHeader({
  children,
  className,
  maxWidth = "default",
  homeHref = "/",
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-6 lg:px-8",
          maxWidth === "wide" ? "max-w-[1400px]" : "max-w-6xl",
        )}
      >
        <Link href={homeHref} className="flex shrink-0 items-center">
          <Logo size="sm" />
        </Link>
        {children && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

interface HeaderActionButtonProps extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  label: string;
}

export function HeaderActionButton({
  icon,
  label,
  className,
  children,
  ...props
}: HeaderActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("rounded-full font-semibold gap-1.5", className)}
      {...props}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {children}
    </Button>
  );
}
