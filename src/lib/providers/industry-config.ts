/**
 * Industry/Profession feed configuration.
 * Profession feeds are sourced from profession-config.ts.
 * Legacy industry aliases are kept for backwards compatibility.
 */

import { getProfession } from "./profession-config";

export type IndustryKey = string; // open — supports both profession IDs and legacy keys

const ALIASES: Record<string, string> = {
  // Onboarding field IDs → profession IDs
  Law:        "lawyer",
  Healthcare: "doctor",
  Technology: "software-engineer",
  Science:    "doctor", // closest match
  Design:     "product-designer",
  Business:   "entrepreneur",
  Insurance:  "sales", // closest match
  // Profession labels → IDs
  "Product Manager":   "product-manager",
  "Software Engineer": "software-engineer",
  "Product Designer":  "product-designer",
  "Content Designer":  "content-designer",
  "Doctor":            "doctor",
  "Teacher":           "teacher",
  "Business Development & Sales": "sales",
  "Entrepreneur":      "entrepreneur",
  "Lawyer":            "lawyer",
};

export function resolveIndustryKey(industry: string): string {
  return ALIASES[industry] ?? industry;
}

/** Hacker News RSS helper */
export function hnFeed(name: string, query: string, points = 10): { name: string; rss: string } {
  return {
    name,
    rss: `https://hnrss.org/newest?q=${encodeURIComponent(query)}&points=${points}`,
  };
}

// ── Feed getters — delegate to profession-config ─────────────────────────────

export function getNewsFeeds(professionOrIndustry: string): { name: string; rss: string }[] {
  const key = resolveIndustryKey(professionOrIndustry);
  const prof = getProfession(key);
  if (prof) return prof.newsFeeds;

  // Fallback: generic AI feeds
  return [
    { name: "TechCrunch AI", rss: "https://techcrunch.com/category/artificial-intelligence/feed/" },
    { name: "VentureBeat AI", rss: "https://venturebeat.com/category/ai/feed/" },
    { name: "The Verge AI",   rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  ];
}

export function getArticleTags(professionOrIndustry: string): string[] {
  const key = resolveIndustryKey(professionOrIndustry);
  const prof = getProfession(key);
  if (prof) return prof.articleTags;
  return ["artificial-intelligence", "ai-tools", "machine-learning"];
}

// ── Profession-specific article publisher feeds ───────────────────────────────

const PUBLISHER_FEEDS: Record<string, { name: string; rss: string }[]> = {
  "sales": [
    { name: "HubSpot Sales Blog",    rss: "https://blog.hubspot.com/sales/rss.xml" },
    { name: "Gong Blog",             rss: "https://www.gong.io/blog/feed/" },
    { name: "Outreach Blog",         rss: "https://www.outreach.io/blog/feed" },
    { name: "TechCrunch",            rss: "https://techcrunch.com/feed/" },
    { name: "a16z",                  rss: "https://a16z.com/feed/" },
    { name: "Y Combinator Blog",     rss: "https://www.ycombinator.com/blog/rss" },
  ],
  "entrepreneur": [
    { name: "Y Combinator Blog",     rss: "https://www.ycombinator.com/blog/rss" },
    { name: "a16z",                  rss: "https://a16z.com/feed/" },
    { name: "TechCrunch",            rss: "https://techcrunch.com/feed/" },
  ],
};

export function getArticlePublishers(professionOrIndustry: string): { name: string; rss: string }[] {
  const key = resolveIndustryKey(professionOrIndustry);
  if (PUBLISHER_FEEDS[key]) return PUBLISHER_FEEDS[key];
  if (key === "software-engineer" || key === "entrepreneur") {
    return UNIVERSAL_ARTICLE_PUBLISHERS;
  }
  return [];
}

export function getYouTubeChannels(professionOrIndustry: string): { name: string; channelId: string }[] {
  const key = resolveIndustryKey(professionOrIndustry);
  const prof = getProfession(key);
  if (prof) return prof.ytChannels;
  return DEFAULT_YOUTUBE_CHANNELS;
}

// ── Universal fallbacks ───────────────────────────────────────────────────────

export const UNIVERSAL_NEWS = [
  { name: "TechCrunch AI", rss: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", rss: "https://venturebeat.com/category/ai/feed/" },
  { name: "Wired AI", rss: "https://www.wired.com/feed/tag/ai/latest/rss" },
  { name: "MIT Tech Review", rss: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
];

export const UNIVERSAL_ARTICLE_PUBLISHERS = [
  { name: "OpenAI Blog",    rss: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic",      rss: "https://www.anthropic.com/news/rss.xml" },
  { name: "Hugging Face",   rss: "https://huggingface.co/blog/feed.xml" },
  { name: "Google AI Blog", rss: "https://blog.google/technology/ai/rss/" },
];

export const DEFAULT_YOUTUBE_CHANNELS = [
  { name: "AI Explained", channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
  { name: "Matt Wolfe",   channelId: "UChpleBmo18P08aKCIgti38g" },
];
