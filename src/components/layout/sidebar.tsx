"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Compass, Bookmark, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/ui/section-label";
import { getInterests } from "@/lib/local-prefs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    setInterests(getInterests());
  }, []);

  return (
    <aside className="glass fixed inset-y-0 z-40 hidden w-64 flex-col border-r border-border bg-card/80 lg:flex">
      <div className="flex h-full flex-col px-4 py-6">
        <Link href="/feed" className="mb-6 px-2">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href === "/feed" && pathname === "/home");
            return (
              <Button
                key={item.href}
                variant={active ? "default" : "ghost"}
                className={cn(
                  "h-10 w-full justify-start gap-3 rounded-lg px-3 font-semibold",
                  active && "shadow-sm",
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <Separator className="my-4" />

        <div className="space-y-3">
          {interests.length > 0 && (
            <div className="px-2">
              <SectionLabel className="mb-2">Your topics</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {interests.slice(0, 3).map((i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-semibold">
                    {i}
                  </Badge>
                ))}
                {interests.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    +{interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-3 font-semibold text-muted-foreground"
            asChild
          >
            <Link href="/feed">
              <Settings className="h-5 w-5" />
              Change interests
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
