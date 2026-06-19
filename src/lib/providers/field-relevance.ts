/**
 * Profession-specific relevance scoring.
 *
 * Core rule: every item must be BOTH profession-relevant AND AI-relevant.
 * Uses anchor terms (precise) + context terms (natural headline language).
 */

import { getProfession, PROFESSIONS } from "./profession-config";
import {
  hasCrossProfessionLeak,
  isGloballyOffTopic,
} from "./profession-filters";
import { getProfessionContext } from "./profession-context";
import type { FeedItem } from "./types";

export function resolveIndustryKey(input: string): string {
  const byId = getProfession(input);
  if (byId) return input;

  const byLabel = PROFESSIONS.find(
    (p) => p.label.toLowerCase() === input.toLowerCase(),
  );
  if (byLabel) return byLabel.id;

  const LEGACY: Record<string, string> = {
    Law: "lawyer", Healthcare: "doctor", Technology: "software-engineer",
    Science: "doctor", Design: "product-designer", Business: "entrepreneur",
    Insurance: "sales", Engineering: "software-engineer", Medical: "doctor",
    Legal: "lawyer", Education: "teacher", Marketing: "sales",
    Entrepreneurship: "entrepreneur", "Product Management": "product-manager",
    Finance: "entrepreneur", "Generative AI": "software-engineer",
    Sales: "sales", Lawyer: "lawyer", Doctor: "doctor",
    Teacher: "teacher", Entrepreneur: "entrepreneur",
    "Product Manager": "product-manager",
    "Software Engineer": "software-engineer",
    "Product Designer": "product-designer",
    "Content Designer": "content-designer",
  };
  return LEGACY[input] ?? input;
}

export const MIN_FIELD_RELEVANCE = 0.58;
export const MIN_FIELD_RELEVANCE_VIDEO = 0.42;

const RELAXED_THRESHOLD = 0.42;
const RELAXED_THRESHOLD_VIDEO = 0.32;
const ABSOLUTE_FLOOR = 0.28;

const TARGET_COUNT = 18;
const MAX_COUNT = 24;

const STRONG_AI_TERMS = [
  "artificial intelligence", "machine learning", "large language model",
  "generative ai", "gen ai", "deep learning", "neural network",
  "chatgpt", "openai", "anthropic", "claude", "gemini", "copilot",
  "llm", "gpt-4", "gpt-5", "gpt-4o", "foundation model",
  "transformer model", "diffusion model", "computer vision",
  "natural language processing", "nlp", "rag", "retrieval augmented",
  "fine-tuning", "prompt engineering", "ai assistant", "ai tool",
  "ai model", "ai agent", "agentic ai", "ai automation",
  "midjourney", "stable diffusion", "dall-e", "text-to-image",
];

const WEAK_TERMS = new Set([
  "ai", "llm", "gpt", "ml", "api", "tools", "tool", "model", "models",
  "agent", "agents", "latest", "news", "2025", "2026", "new", "using",
  "platform", "product", "feature", "update", "launch", "workflow",
]);

const GENERIC_AI_PATTERNS = [
  /^(openai|anthropic|google deepmind|meta ai|microsoft)\s+(launches?|releases?|announces?|unveils?)/i,
  /releases? (its )?(new )?(gpt-\d|claude \d|gemini \d|llama \d)/i,
  /raises? \$[\d.]+\s*[mb]illion (for|in|to) (ai|llm)/i,
  /^(nvidia|apple|amazon|tesla)\s+(stock|shares|earnings)/i,
];

function termVariants(term: string): string[] {
  const out = new Set([term]);
  if (term.endsWith("s") && term.length > 4) out.add(term.slice(0, -1));
  if (!term.endsWith("s") && term.length > 3) out.add(`${term}s`);
  if (term.endsWith("ing") && term.length > 5) out.add(term.slice(0, -3));
  return [...out];
}

function termMatches(text: string, term: string): boolean {
  return termVariants(term).some((v) => {
    if (v.length <= 4) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(text);
    }
    return text.includes(v);
  });
}

function hasStrongAiSignal(text: string): boolean {
  return STRONG_AI_TERMS.some((t) => termMatches(text, t));
}

function hasAiMention(text: string): boolean {
  if (hasStrongAiSignal(text)) return true;
  return /\b(ai|llm|gpt|ml|chatgpt|claude|gemini|copilot)\b/i.test(text);
}

function passesAiGate(
  title: string,
  body: string,
  professionSignal: number,
  isVideo: boolean,
): boolean {
  if (hasStrongAiSignal(title)) return true;
  if (hasStrongAiSignal(body) && professionSignal >= 1) return true;
  if (hasAiMention(title) && professionSignal >= 1) return true;
  if (hasAiMention(body) && professionSignal >= 2) return true;
  // Education/product videos: AI may live in description while title names the product
  if (isVideo && professionSignal >= 1 && hasAiMention(body)) return true;
  return false;
}

function isGenericAiHeadline(title: string): boolean {
  return GENERIC_AI_PATTERNS.some((p) => p.test(title));
}

function getAnchorTerms(key: string): string[] {
  const prof = getProfession(key);
  if (prof) return [...new Set([...prof.anchors, ...prof.tools])];

  const byLabel = PROFESSIONS.find(
    (p) => p.label.toLowerCase() === key.toLowerCase(),
  );
  if (byLabel) return [...new Set([...byLabel.anchors, ...byLabel.tools])];

  return [];
}

export function computeFieldRelevance(item: FeedItem, professionOrIndustry: string): number {
  const key = resolveIndustryKey(professionOrIndustry);
  const title = item.title.toLowerCase();
  const body = `${item.title} ${item.summary}`.toLowerCase();
  const fullText = body;
  const isVideo = item.contentType === "Videos";

  if (isGloballyOffTopic(fullText)) return 0;

  const terms = getAnchorTerms(key);
  const contextTerms = getProfessionContext(key);
  if (terms.length === 0 && contextTerms.length === 0) return 0.1;

  let domainScore = 0;
  let strongTitleHits = 0;
  let strongBodyHits = 0;
  let contextTitleHits = 0;
  let contextBodyHits = 0;

  for (const term of terms) {
    const isWeak = WEAK_TERMS.has(term);
    if (termMatches(title, term)) {
      domainScore += isWeak ? 0.05 : 0.30;
      if (!isWeak) strongTitleHits++;
    } else if (termMatches(body, term)) {
      domainScore += isWeak ? 0.02 : 0.12;
      if (!isWeak) strongBodyHits++;
    }
  }

  for (const term of contextTerms) {
    if (term.length < 4) continue;
    if (termMatches(title, term)) {
      domainScore += 0.16;
      contextTitleHits++;
    } else if (termMatches(body, term)) {
      domainScore += 0.07;
      contextBodyHits++;
    }
  }

  const professionSignal =
    strongTitleHits + strongBodyHits + (contextTitleHits > 0 ? 1 : 0) + (contextBodyHits > 0 ? 1 : 0);

  if (hasCrossProfessionLeak(fullText, key) && strongTitleHits === 0 && contextTitleHits === 0) {
    return 0.08;
  }

  if (isGenericAiHeadline(item.title)) {
    const tracksModels = key === "software-engineer" || key === "entrepreneur";
    if (!tracksModels || (strongTitleHits === 0 && contextTitleHits === 0)) return 0.12;
  }

  if (professionSignal === 0) return Math.min(domainScore, 0.18);

  if (!passesAiGate(title, body, professionSignal, isVideo)) {
    return Math.min(domainScore * 0.4, 0.38);
  }

  let aiMultiplier = hasStrongAiSignal(title) ? 1.0 : hasStrongAiSignal(body) ? 0.9 : 0.82;
  if (hasAiMention(title)) domainScore += 0.12;

  let score = Math.min(domainScore * aiMultiplier, 1);

  const titleProfession = strongTitleHits >= 1 || contextTitleHits >= 1;
  if (titleProfession && hasAiMention(title)) score = Math.max(score, 0.78);
  if (titleProfession && hasStrongAiSignal(body)) score = Math.max(score, 0.72);
  if (professionSignal >= 3 && hasAiMention(body)) score = Math.max(score, 0.65);
  if (isVideo && contextTitleHits >= 1 && hasAiMention(body)) score = Math.max(score, 0.55);

  if (!titleProfession && contextBodyHits <= 1) {
    score = Math.min(score, 0.52);
  }

  return score;
}

export function filterByFieldRelevance(
  items: FeedItem[],
  resolveIndustry: (item: FeedItem) => string,
): FeedItem[] {
  if (items.length === 0) return [];

  const isVideoBatch = items.every((i) => i.contentType === "Videos");
  const strictThreshold = isVideoBatch ? MIN_FIELD_RELEVANCE_VIDEO : MIN_FIELD_RELEVANCE;
  const relaxedThreshold = isVideoBatch ? RELAXED_THRESHOLD_VIDEO : RELAXED_THRESHOLD;

  const scored = items
    .map((item) => ({
      item,
      score: computeFieldRelevance(item, resolveIndustry(item)),
    }))
    .sort((a, b) => b.score - a.score);

  const strict = scored.filter((x) => x.score >= strictThreshold);
  if (strict.length >= TARGET_COUNT) {
    return strict.slice(0, MAX_COUNT).map((x) => x.item);
  }

  const picked: FeedItem[] = [];
  const used = new Set<string>();

  for (const x of strict) {
    if (picked.length >= MAX_COUNT) break;
    picked.push(x.item);
    used.add(x.item.url);
  }

  for (const x of scored) {
    if (picked.length >= MAX_COUNT) break;
    if (x.score < relaxedThreshold) break;
    if (used.has(x.item.url)) continue;
    picked.push(x.item);
    used.add(x.item.url);
  }

  if (picked.length > 0) return picked;

  return scored
    .filter((x) => x.score >= ABSOLUTE_FLOOR)
    .slice(0, MAX_COUNT)
    .map((x) => x.item);
}
