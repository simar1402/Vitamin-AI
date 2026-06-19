"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { clearPreferences } from "@/lib/local-prefs";
import { agentLog, userIdHint } from "@/lib/debug-agent-log";
import { getAuthCallbackUrl, getClientSiteUrl } from "@/lib/site-url";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const finish = (s: Session | null) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    };

    // Never block the UI if Supabase is slow or unreachable
    const timeout = setTimeout(() => finish(null), 5000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        clearTimeout(timeout);
        finish(data.session);
      })
      .catch(() => {
        clearTimeout(timeout);
        finish(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    const siteUrl = getClientSiteUrl();
    const redirectTo = getAuthCallbackUrl(siteUrl);

    console.info("[auth] Starting Google OAuth", {
      siteUrl,
      redirectTo,
      browserOrigin:
        typeof window !== "undefined" ? window.location.origin : "ssr",
      configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    });

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "email profile",
        queryParams: {
          // Always show the Google account picker, never silently reuse a session
          prompt: "select_account",
        },
      },
    });
  }, [supabase]);

  const signOut = useCallback(async () => {
    agentLog(
      "auth-provider:signOut",
      "clearing local prefs",
      { userHint: userIdHint(session?.user?.id) },
      "H4",
    );
    clearPreferences();
    await supabase.auth.signOut();
    window.location.replace("/");
  }, [supabase, session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
