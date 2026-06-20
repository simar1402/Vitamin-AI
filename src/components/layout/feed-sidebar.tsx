"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  LogOut,
  LogIn,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Loader2,
  Home,
  Settings,
} from "lucide-react";
import { PROFESSIONS } from "@/lib/providers/profession-config";
import { useState } from "react";

interface FeedSidebarProps {
  profession: string;
  loading: boolean;
  user: { email?: string | null } | null;
  onRefresh: () => void;
  onSignOut: () => void;
  onChangeProfession: (id: string) => void;
}

export function FeedSidebar({
  profession,
  loading,
  user,
  onRefresh,
  onSignOut,
  onChangeProfession,
}: FeedSidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const profConfig = PROFESSIONS.find((p) => p.id === profession);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-2 pb-3">
        <div>
          <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Navigate
          </p>
          <div className="mt-0.5 space-y-0.5">
            <NavItem
              icon={<Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              label="Home"
              href="/feed"
              active={pathname === "/feed"}
            />
            <NavItem
              icon={<Bookmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              label="Bookmarks"
              href="/saved"
              active={pathname === "/saved"}
            />
          </div>
        </div>

        <div className="mx-2 my-3 border-t border-border" />

        <div className="space-y-0.5">
          <NavItem
            icon={
              loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              )
            }
            label="Refresh feed"
            disabled={loading || !profession}
            onClick={onRefresh}
          />
        </div>
      </div>

      <div className="shrink-0 px-2 pb-4">
        <Separator className="mb-3 bg-border" />

        {user ? (
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors",
                settingsOpen
                  ? "bg-accent text-foreground"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Settings
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
            </button>

            {settingsOpen && (
              <div className="mt-0.5 space-y-2 rounded-md border border-border bg-background px-2 py-2">
                {user.email && (
                  <p className="truncate px-1 text-[11px] text-muted-foreground" title={user.email}>
                    {user.email}
                  </p>
                )}

                <div>
                  <p className="px-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Profession
                  </p>
                  <button
                    type="button"
                    onClick={() => setProfOpen((o) => !o)}
                    className={cn(
                      "mt-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                      profOpen && "bg-accent",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{profConfig?.emoji ?? "🌿"}</span>
                      <span className="truncate text-[13px] font-medium text-foreground/80">
                        {profConfig?.label ?? "Select profession"}
                      </span>
                    </div>
                    {profOpen ? (
                      <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {profOpen && (
                    <div className="mt-0.5 max-h-48 overflow-y-auto rounded-md border border-border">
                      {PROFESSIONS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onChangeProfession(p.id);
                            setProfOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-accent",
                            profession === p.id
                              ? "bg-accent font-medium text-foreground"
                              : "text-foreground/70",
                          )}
                        >
                          <span className="text-sm">{p.emoji}</span>
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <NavItem
                  icon={<LogOut className="h-3.5 w-3.5 text-muted-foreground" />}
                  label="Sign out"
                  onClick={onSignOut}
                />
              </div>
            )}
          </div>
        ) : (
          <NavItem
            icon={<LogIn className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Sign in"
            href="/"
          />
        )}
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, disabled, active, onClick }: NavItemProps) {
  const cls = cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors",
    active
      ? "bg-accent text-foreground"
      : "text-foreground/70 hover:bg-accent hover:text-foreground",
    disabled && "pointer-events-none cursor-not-allowed opacity-40",
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-current={active ? "page" : undefined}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {icon}
      {label}
    </button>
  );
}
