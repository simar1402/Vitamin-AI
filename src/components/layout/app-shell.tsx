"use client";

import Link from "next/link";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { SiteHeader, HeaderActionButton } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export const REFRESH_EVENT = "vitamin:refresh";

export function AppShell({ children }: { children: ReactNode }) {
  const triggerRefresh = () => {
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader>
        <HeaderActionButton
          icon={<RefreshCw className="h-4 w-4" />}
          label="Refresh"
          onClick={triggerRefresh}
        />
        <Button variant="outline" size="sm" className="rounded-full font-semibold gap-1.5" asChild>
          <Link href="/feed">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Edit interests</span>
          </Link>
        </Button>
      </SiteHeader>
      <main>{children}</main>
    </div>
  );
}
