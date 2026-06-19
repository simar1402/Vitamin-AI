import type { User } from "@supabase/supabase-js";

/** Capitalize the first character of a string. */
function capitalize(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Extract first name from a full display name. */
function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return capitalize(trimmed.split(/\s+/)[0] ?? trimmed);
}

/** Extract first name from a full display name or email fallback. */
export function getFirstName(
  fullName?: string | null,
  email?: string | null,
): string {
  if (fullName?.trim()) {
    return firstNameFromFullName(fullName);
  }
  return getDisplayNameFromEmail(email);
}

/**
 * Derive a friendly first name from the user's email local part.
 * Used only when OAuth / profile name is unavailable.
 */
export function getDisplayNameFromEmail(email: string | null | undefined): string {
  if (!email) return "there";

  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "there";

  const segment = local.split(/[._+-]/)[0] ?? local;
  const cleaned = segment.replace(/\d+$/, "").trim();
  if (!cleaned) return "there";

  return capitalize(cleaned);
}

/**
 * Resolve the user's first name for greetings.
 * Priority: stored profile name → Google OAuth name → email fallback.
 */
export function getDisplayNameFromUser(
  user: User | null | undefined,
  storedFullName?: string | null,
): string {
  if (storedFullName?.trim()) {
    return firstNameFromFullName(storedFullName);
  }

  if (!user) return "there";

  const fromMeta =
    user.user_metadata?.full_name ??
    user.user_metadata?.name;

  if (fromMeta?.trim()) {
    return firstNameFromFullName(fromMeta);
  }

  return getDisplayNameFromEmail(user.email);
}

/** "a" vs "an" before a profession label. */
export function professionArticle(label: string): string {
  return /^[aeiou]/i.test(label.trim()) ? "an" : "a";
}
