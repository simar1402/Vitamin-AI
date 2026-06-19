"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useUserPrefs } from "@/providers/user-prefs-provider";
import { isProfileComplete } from "@/lib/user-prefs-sync";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { AppLoader } from "@/components/layout/app-loader";
import { getDisplayNameFromUser } from "@/lib/user-display-name";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { ready: prefsReady, profile } = useUserPrefs();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(
    searchParams.get("error") === "auth",
  );

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setAuthError(false);
    try {
      await signInWithGoogle();
    } catch {
      setSigningIn(false);
      setAuthError(true);
    }
  }

  function handleContinue() {
    if (!prefsReady) return;
    router.push(isProfileComplete(profile) ? "/feed" : "/onboarding");
  }

  const firstName = getDisplayNameFromUser(user, profile?.fullName);

  // Returning users: skip the landing page once prefs are loaded
  useEffect(() => {
    if (loading || !user || !prefsReady) return;
    router.replace(isProfileComplete(profile) ? "/feed" : "/onboarding");
  }, [loading, user, prefsReady, profile, router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-radial-warm opacity-80" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {/* Animated pill + wordmark */}
        <PillReveal />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-lg text-muted-foreground md:text-[18px] md:leading-[1.38]"
        >
          Daily AI nutrition for your{" "}
          <span className="font-semibold text-foreground">profession</span>.
        </motion.p>

        {/* CTA — swaps based on auth state */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 w-full max-w-xs"
        >
          <AnimatePresence mode="wait">
            {loading || (user && !prefsReady) ? (
              user ? (
                <AppLoader className="py-2" />
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </motion.div>
              )
            ) : user ? (
              /* ── Logged-in variant ── */
              <motion.div
                key="logged-in"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue as {firstName}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              /* ── Logged-out variant ── */
              <motion.div
                key="logged-out"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="flex w-full items-center justify-center gap-2.5 rounded-md border border-[rgba(28,28,28,0.4)] bg-transparent px-5 py-3 text-sm font-normal text-foreground transition-all hover:bg-accent disabled:opacity-60 focus-visible:shadow-focus-warm"
                >
                  {signingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                {authError && (
                  <p className="text-[12px] text-red-500">
                    Sign-in failed — please try again.
                  </p>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  We&apos;ll use your Google name to personalize your feed · free during early access
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Minimal footer */}
      <footer className="absolute bottom-6 left-0 right-0 flex justify-center">
        <p className="text-xs text-muted-foreground/70">© 2026 Vitamin-AI</p>
      </footer>
    </div>
  );
}

// ── Logo reveal animation ─────────────────────────────────────────────────────

function PillReveal() {
  return (
    <div className="flex flex-col items-center select-none" aria-label="Vitamin-AI">
      {/* Glow blob behind the pill */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="pointer-events-none absolute rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.5, 0.35], scale: [0.4, 1.2, 1.0] }}
          transition={{ duration: 1.8, times: [0, 0.5, 1], ease: "easeOut" }}
          style={{ width: 160, height: 160 }}
        />

        {/* Pill image — drops in from above */}
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.7, rotate: -12 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/logo-pill.png"
            alt="Vitamin-AI"
            width={100}
            height={100}
            priority
            className="drop-shadow-xl"
          />
        </motion.div>
      </div>

      {/* Sparkle particles */}
      <div className="relative h-0 w-0">
        {[...Array(10)].map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 60 + (i % 3) * 14;
          return (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-foreground/30"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                opacity: [0, 1, 0],
                scale: [0, 1.3, 0],
              }}
              transition={{ duration: 0.7, delay: 0.7 + (i % 4) * 0.04, ease: "easeOut" }}
            />
          );
        })}
      </div>

      {/* Wordmark — Cal Sans, fades up after pill lands */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 text-display-hero leading-none text-foreground"
        style={{
          fontFamily: "var(--font-brand)",
          fontWeight: 600,
          fontSize: "clamp(2.8rem, 8vw, 5rem)",
          letterSpacing: "-0.025em",
        }}
      >
        Vitamin-AI
      </motion.h1>
    </div>
  );
}
