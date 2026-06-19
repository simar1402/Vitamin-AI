/**
 * Off-topic and cross-profession leak detection.
 * Keeps feeds focused on AI × {profession}, not generic tech/crypto/gaming
 * or content clearly meant for another job role.
 */

import type { ProfessionId } from "./profession-config";

/** Hard-reject: never relevant to a professional AI digest */
export const GLOBAL_OFF_TOPIC = [
  "cryptocurrency", "crypto trading", "bitcoin", "ethereum", "nft", "web3",
  "blockchain gaming", "play-to-earn", "meme coin", "defi ",
  "fortnite", "minecraft", "roblox", "playstation", "xbox", "nintendo",
  "esports", "video game release", "gaming laptop review",
  "nfl ", "nba ", "premier league", "cricket world cup", "super bowl",
  "celebrity gossip", "kardashian", "red carpet", "box office",
  "recipe for", "cooking tutorial", "restaurant review", "meal prep",
  "weight loss", "keto diet", "supplement review",
  "horoscope", "zodiac sign", "tarot reading",
  "onlyfans", "dating app review", "tinder ",
  "get rich quick", "passive income scam",
  "beauty tutorial", "makeup routine", "skincare routine",
  "travel vlog", "vacation guide", "hotel review",
];

/**
 * Strong signals of another profession's domain.
 * If these appear without the user's profession anchors in the title → reject.
 */
export const PROFESSION_LEAKS: Record<ProfessionId, string[]> = {
  teacher: [
    "github copilot", "cursor ai", "devin ai", "langchain", "kubernetes",
    "learn to code", "coding career", "software engineer", "typescript",
    "salesforce", "gong.io", "outbound sales", "cold email", "pipeline",
    "radiology ai", "surgical robot", "fda clearance medical", "clinical trial patient",
    "contract review", "legal brief", "eu ai act compliance", "harvey ai",
    "figma ai", "ux wireframe", "design system tokens",
    "venture capital", "series a funding", "cap table",
    "stock trading", "forex", "options trading",
  ],
  doctor: [
    "lesson plan", "classroom management", "k-12", "student engagement",
    "github copilot", "pull request", "typescript", "react developer",
    "sales pipeline", "sdr ", "bdr ", "quota attainment", "cold outreach",
    "figma ai", "ux research", "wireframe",
    "legal contract", "litigation", "law firm billing",
    "no-code startup", "indie hacker", "vibe coding",
  ],
  lawyer: [
    "lesson plan", "classroom ai", "student assessment", "edtech",
    "radiology report", "patient diagnosis", "clinical workflow", "ehr integration",
    "github copilot", "coding assistant", "software engineer",
    "sales automation", "crm workflow", "lead generation tool",
    "figma prototype", "design handoff",
    "midjourney prompt", "stable diffusion",
  ],
  "software-engineer": [
    "lesson plan", "teacher workflow", "classroom ai", "khanmigo",
    "patient care ai", "clinical decision", "medical imaging",
    "legal research ai", "contract clause", "law firm",
    "sales playbook", "outbound prospecting", "revenue intelligence",
    "real estate agent", "insurance policy",
  ],
  "product-manager": [
    "lesson plan", "classroom", "patient diagnosis", "surgical",
    "legal brief", "court ruling", "litigation strategy",
    "cold email template", "sales script", "quota",
    "coding tutorial python", "leetcode", "system design interview",
  ],
  "product-designer": [
    "lesson plan", "clinical trial", "patient records", "diagnosis ai",
    "legal contract review", "compliance audit legal",
    "sales pipeline", "crm automation", "outbound sales",
    "kubernetes", "docker container", "api endpoint",
  ],
  "content-designer": [
    "clinical ai", "radiology", "patient diagnosis", "fda medical",
    "legal contract", "litigation", "court case",
    "sales automation", "pipeline forecasting",
    "coding tutorial", "software architecture",
    "figma tutorial", "ui design tutorial", "logo design", "visual design mockup",
    "color palette design", "wireframe tutorial", "design system components figma",
  ],
  sales: [
    "lesson plan", "classroom ai", "student learning analytics",
    "patient diagnosis", "clinical workflow", "medical imaging ai",
    "legal brief", "case law research", "court ruling",
    "coding tutorial", "react hooks", "kubernetes deployment",
    "figma component", "design system audit",
  ],
  entrepreneur: [
    "lesson plan", "classroom management", "grading rubric",
    "patient diagnosis", "clinical guidelines", "medical device fda",
    "legal brief writing", "case citation",
    "sales quota", "cold call script",
  ],
};

function termMatches(text: string, term: string): boolean {
  const t = term.toLowerCase().trim();
  if (t.length <= 4) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(text);
  }
  return text.includes(t);
}

export function isGloballyOffTopic(text: string): boolean {
  const lower = text.toLowerCase();
  return GLOBAL_OFF_TOPIC.some((t) => termMatches(lower, t));
}

export function hasCrossProfessionLeak(text: string, professionId: string): boolean {
  const leaks = PROFESSION_LEAKS[professionId as ProfessionId];
  if (!leaks?.length) return false;
  const lower = text.toLowerCase();
  return leaks.some((t) => termMatches(lower, t));
}
