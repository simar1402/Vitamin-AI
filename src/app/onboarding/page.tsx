"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Clipboard,
  Code2,
  Paintbrush2,
  FileText,
  Stethoscope,
  GraduationCap,
  TrendingUp,
  Rocket,
  Scale,
  BookOpen,
  Play,
  Layers,
  Check,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/layout/page-container";
import {
  setProfession as saveProfession,
  setContentTypes as saveContentTypes,
  setOnboarded,
  setShowWelcomeLoader,
} from "@/lib/local-prefs";
import { cn } from "@/lib/utils";
import type { ProfessionId } from "@/lib/providers/profession-config";
import { useUserPrefs } from "@/providers/user-prefs-provider";
import { AppLoader } from "@/components/layout/app-loader";
import { isProfileComplete } from "@/lib/user-prefs-sync";

const PROFESSIONS = [
  {
    id: "product-manager" as ProfessionId,
    label: "Product Manager",
    icon: Clipboard,
    desc: "AI for strategy, roadmaps & analytics",
    tools: "Productboard, Jira AI, Notion AI",
  },
  {
    id: "software-engineer" as ProfessionId,
    label: "Software Engineer",
    icon: Code2,
    desc: "AI coding tools & developer workflows",
    tools: "Cursor, Copilot, Claude Code",
  },
  {
    id: "product-designer" as ProfessionId,
    label: "Product Designer",
    icon: Paintbrush2,
    desc: "AI for UX, UI design & creative work",
    tools: "Figma AI, v0, Galileo AI",
  },
  {
    id: "content-designer" as ProfessionId,
    label: "Content Writer",
    icon: FileText,
    desc: "AI for UX writing, copywriting & content strategy",
    tools: "ChatGPT, Jasper, Grammarly, Writer AI",
  },
  {
    id: "doctor" as ProfessionId,
    label: "Doctor",
    icon: Stethoscope,
    desc: "AI in clinical practice & diagnostics",
    tools: "Nuance DAX, Aidoc, Med-PaLM",
  },
  {
    id: "teacher" as ProfessionId,
    label: "Teacher",
    icon: GraduationCap,
    desc: "AI tools for education & learning",
    tools: "Khanmigo, MagicSchool AI",
  },
  {
    id: "sales" as ProfessionId,
    label: "Business Dev & Sales",
    icon: TrendingUp,
    desc: "AI for revenue growth & outreach",
    tools: "Clay, Gong, HubSpot AI",
  },
  {
    id: "entrepreneur" as ProfessionId,
    label: "Entrepreneur",
    icon: Rocket,
    desc: "AI for founders & building fast",
    tools: "Lovable, Bolt, Cursor",
  },
  {
    id: "lawyer" as ProfessionId,
    label: "Law",
    icon: Scale,
    desc: "AI for legal research & compliance",
    tools: "Harvey, CoCounsel, Lexis+ AI",
  },
] as const;

// Maps consume preference → actual content type strings stored in prefs
const CONSUME_OPTIONS = [
  {
    id: "read" as const,
    label: "Reading",
    icon: BookOpen,
    desc: "News, articles & blogs",
    types: ["News", "Articles"],
  },
  {
    id: "watch" as const,
    label: "Watching",
    icon: Play,
    desc: "YouTube videos & shorts",
    types: ["Videos"],
  },
  {
    id: "both" as const,
    label: "Both",
    icon: Layers,
    desc: "Everything — read & watch",
    types: ["News", "Articles", "Videos"],
  },
] as const;

type ConsumeId = typeof CONSUME_OPTIONS[number]["id"];

export default function Onboarding() {
  const router = useRouter();
  const { ready, profile, saveProfile } = useUserPrefs();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<ProfessionId | null>(null);
  const [consumeId, setConsumeId] = useState<ConsumeId | null>(null);

  const total = 2;

  useEffect(() => {
    if (!ready) return;
    if (isProfileComplete(profile)) {
      router.replace("/feed");
    }
  }, [ready, profile, router]);

  const canContinue =
    (step === 0 && profession !== null) ||
    (step === 1 && consumeId !== null);

  const finish = async () => {
    if (!profession || !consumeId) return;
    const types = CONSUME_OPTIONS.find((o) => o.id === consumeId)!.types;
    saveProfession(profession);
    saveContentTypes([...types]);
    setOnboarded();
    try {
      await saveProfile({
        profession,
        contentTypes: [...types],
        onboarded: true,
      });
      setShowWelcomeLoader();
      router.push("/feed");
    } catch (err) {
      console.error("[onboarding] failed to save profile:", err);
    }
  };

  const selectedProfession = PROFESSIONS.find((p) => p.id === profession);

  if (!ready) {
    return <AppLoader fullScreen />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-radial-warm" />

      <PageContainer size="narrow" className="relative z-10 flex flex-1 flex-col py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full font-semibold"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-full font-semibold" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          )}
          <Logo size="sm" />
          <span className="text-xs font-medium text-muted-foreground">
            {step + 1} / {total}
          </span>
        </header>

        <Progress value={((step + 1) / total) * 100} className="mb-8 h-1.5" />

        <main className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1"
            >
              {/* ── Step 0: Pick your profession ── */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      Step 1 of 2
                    </p>
                    <h1 className="text-display-section text-3xl md:text-4xl">
                      What&apos;s your profession?
                    </h1>
                    <p className="text-muted-foreground">
                      We&apos;ll surface only AI developments directly relevant to your work.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PROFESSIONS.map(({ id, label, icon: Icon, desc, tools }) => {
                      const active = profession === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setProfession(id)}
                          className={cn(
                            "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                            active
                              ? "border-[rgba(28,28,28,0.4)] bg-accent"
                              : "border-border bg-card hover:border-[rgba(28,28,28,0.25)] hover:bg-accent/60",
                          )}
                        >
                          {active && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-inset-button">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </span>
                          )}
                          <div
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 pr-6">
                            <p className={cn("text-sm font-semibold leading-tight", active && "text-foreground")}>
                              {label}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                              {desc}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/60 leading-snug">
                              {tools}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 1: How do you prefer to consume? ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      Step 2 of 2
                    </p>
                    <h1 className="text-display-section text-3xl md:text-4xl">
                      How do you prefer to consume your Vitamin-AI?
                    </h1>
                    {selectedProfession && (
                      <p className="text-muted-foreground">
                        We&apos;ll serve{" "}
                        <span className="font-semibold text-foreground">
                          {selectedProfession.label}
                        </span>{" "}
                        AI updates in the format that suits you.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {CONSUME_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
                      const active = consumeId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setConsumeId(id)}
                          className={cn(
                            "group relative flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all duration-200",
                            active
                              ? "border-[rgba(28,28,28,0.4)] bg-accent"
                              : "border-border bg-card hover:border-[rgba(28,28,28,0.25)] hover:bg-accent/60",
                          )}
                        >
                          {active && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-inset-button">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </span>
                          )}
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={cn("font-semibold", active && "text-foreground")}>{label}</p>
                            <p className="mt-1 text-xs text-muted-foreground leading-snug">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer actions */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            <div />
            {step < total - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
                size="lg"
                className="px-8"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={finish}
                disabled={!canContinue}
                size="lg"
                className="px-8"
              >
                Build my feed
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </main>
      </PageContainer>
    </div>
  );
}
