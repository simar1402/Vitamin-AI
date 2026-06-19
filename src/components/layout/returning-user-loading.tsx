"use client";

import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { PencilLoader } from "@/components/ui/loader-1";
import { getDisplayNameFromUser } from "@/lib/user-display-name";

interface ReturningUserLoadingProps {
  user: User | null | undefined;
  storedFullName?: string | null;
  className?: string;
}

export function ReturningUserLoading({ user, storedFullName, className }: ReturningUserLoadingProps) {
  const name = getDisplayNameFromUser(user, storedFullName);

  return (
    <div
      className={
        className ??
        "flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center"
      }
    >
      <PencilLoader size={120} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-sm space-y-2"
      >
        <p className="text-lg font-medium tracking-tight text-foreground">
          Welcome, {name}
        </p>
        <p className="text-[13px] leading-relaxed tracking-wide text-muted-foreground animate-pulse">
          Curating your vitamin-AI dose for today..
        </p>
      </motion.div>
    </div>
  );
}
