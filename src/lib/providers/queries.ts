/**
 * Profession-specific search queries.
 * Sourced from profession-config.ts — single source of truth.
 */

import { getProfession, PROFESSIONS } from "./profession-config";

/** Return the best queries for a given profession/industry key (up to `max`) */
export function getQueries(industryOrProfession: string, max = 3): string[] {
  // Try direct profession ID match first
  const prof = getProfession(industryOrProfession);
  if (prof) return prof.queries.slice(0, max);

  // Try matching by label (e.g. "Product Manager" → "product-manager")
  const byLabel = PROFESSIONS.find(
    (p) => p.label.toLowerCase() === industryOrProfession.toLowerCase(),
  );
  if (byLabel) return byLabel.queries.slice(0, max);

  // Fallback for legacy industry keys
  const LEGACY: Record<string, string[]> = {
    "Product Manager":   ["AI product management", "AI roadmap tool", "product analytics AI"],
    "Software Engineer": ["AI coding assistant 2025", "GitHub Copilot", "LLM engineering"],
    "Product Designer":  ["AI UX design tools", "Figma AI", "generative UI AI"],
    "Doctor":            ["AI healthcare diagnosis", "clinical AI tools", "AI medical imaging"],
    "Teacher":           ["AI education tools", "AI personalized learning", "EdTech AI"],
    "Sales":             ["AI sales tools 2025", "AI SDR BDR automation", "revenue intelligence AI Gong Clari", "AI lead generation B2B outbound", "GTM strategy AI startup"],
    "Entrepreneur":      ["AI startup tools", "no-code AI builder", "AI founder productivity"],
    "Lawyer":            ["AI legal tools", "Harvey AI", "AI contract review"],
    // Keep old industry fallbacks for any cached/legacy data
    Design:              ["AI design tools 2025", "Figma AI features", "AI UX design"],
    Engineering:         ["AI coding tools", "Cursor AI editor", "LLM coding assistant"],
    Medical:             ["healthcare AI 2025", "medical AI diagnosis", "AI drug discovery"],
    Legal:               ["AI legal regulation", "AI policy 2025", "LegalTech AI"],
    Finance:             ["AI fintech 2025", "AI investment tools", "AI trading algorithms"],
    Insurance:           ["AI insurance", "insurtech AI", "AI underwriting"],
    Education:           ["AI education tools", "AI tutoring", "EdTech AI"],
    Business:            ["AI business tools", "enterprise AI", "AI automation business"],
    "Generative AI":     ["generative AI 2025", "LLM news", "AI agents latest"],
  };

  const fallback = LEGACY[industryOrProfession];
  if (fallback) return fallback.slice(0, max);

  return ["AI tools 2025", "artificial intelligence news", "AI latest updates"].slice(0, max);
}
