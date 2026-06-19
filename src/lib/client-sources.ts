/**
 * Client-side source map — browser-safe (no server imports).
 * Maps each interest/profession to RSS feeds and YouTube channels.
 */

export interface ClientSources {
  news: { name: string; rss: string }[];
  articles: { name: string; rss: string }[];
  youtube: { name: string; channelId: string }[];
}

const UNIVERSAL_NEWS = [
  { name: "TechCrunch AI", rss: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", rss: "https://venturebeat.com/category/ai/feed/" },
  { name: "The Verge AI", rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "Wired AI", rss: "https://www.wired.com/feed/tag/ai/latest/rss" },
  { name: "Hacker News", rss: "https://hnrss.org/newest?q=AI+OR+LLM+OR+machine+learning&points=50" },
];

const UNIVERSAL_ARTICLES = [
  { name: "OpenAI Blog", rss: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic", rss: "https://www.anthropic.com/news/rss.xml" },
  { name: "Google AI Blog", rss: "https://blog.google/technology/ai/rss/" },
  { name: "Hugging Face", rss: "https://huggingface.co/blog/feed.xml" },
  { name: "Dev.to", rss: "https://dev.to/feed" },
];

const UNIVERSAL_YT = [
  { name: "Two Minute Papers", channelId: "UCbfYPyITQ-7l4upoX8nvctg" },
  { name: "AI Explained", channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
  { name: "Matt Wolfe", channelId: "UChpleBmo18P08aKCIgti38g" },
  { name: "Wes Roth", channelId: "UCnzNE-AAIhWPZWDMpADFJZQ" },
];

const SOURCE_MAP: Record<string, Partial<ClientSources>> = {
  // Design
  Designer: {
    articles: [
      { name: "Figma Blog", rss: "https://www.figma.com/blog/rss/" },
      { name: "UX Collective", rss: "https://uxdesign.cc/feed" },
    ],
    youtube: [
      { name: "DesignCourse", channelId: "UCVyRiMvfUNMA1UPlDPzG5Ow" },
      ...UNIVERSAL_YT,
    ],
  },
  "Product Design": {
    articles: [
      { name: "Figma Blog", rss: "https://www.figma.com/blog/rss/" },
      { name: "UX Collective", rss: "https://uxdesign.cc/feed" },
    ],
    youtube: [{ name: "DesignCourse", channelId: "UCVyRiMvfUNMA1UPlDPzG5Ow" }, ...UNIVERSAL_YT],
  },
  "UX Research": {
    articles: [{ name: "UX Collective", rss: "https://uxdesign.cc/feed" }],
    youtube: UNIVERSAL_YT,
  },
  "Fashion Design": {
    news: [
      { name: "Elle Fashion", rss: "https://www.elle.com/rss/fashion.xml" },
      { name: "Harper's Bazaar Fashion", rss: "https://www.harpersbazaar.com/rss/fashion.xml" },
      { name: "WWD", rss: "https://wwd.com/feed/" },
    ],
    articles: [
      { name: "Vogue", rss: "https://www.vogue.com/feed/rss" },
      { name: "Dezeen Fashion", rss: "https://www.dezeen.com/feed/" },
    ],
    youtube: [
      { name: "Bestdressed", channelId: "UCfCvMjEWUBPSHBRsFvBrLsQ" },
      { name: "Business of Fashion", channelId: "UCbmNph6atAoGfqLoCL_duAg" },
      ...UNIVERSAL_YT,
    ],
  },
  Architecture: {
    articles: [{ name: "Dezeen", rss: "https://www.dezeen.com/feed/" }],
    youtube: UNIVERSAL_YT,
  },

  // Engineering / Tech
  Developer: {
    news: [
      { name: "Hacker News AI", rss: "https://hnrss.org/newest?q=AI+OR+LLM+OR+Copilot&points=50" },
      { name: "The Verge AI", rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
    ],
    articles: [
      { name: "GitHub Blog", rss: "https://github.blog/feed/" },
      { name: "Cloudflare Blog", rss: "https://blog.cloudflare.com/rss/" },
    ],
    youtube: [
      { name: "Fireship", channelId: "UCsBjURrPoezykLs9EqgamOA" },
      { name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" },
      ...UNIVERSAL_YT,
    ],
  },
  "Software Engineering": {
    news: [{ name: "Hacker News", rss: "https://hnrss.org/frontpage?points=150" }],
    articles: [{ name: "GitHub Blog", rss: "https://github.blog/feed/" }],
    youtube: [{ name: "Fireship", channelId: "UCsBjURrPoezykLs9EqgamOA" }, ...UNIVERSAL_YT],
  },
  Robotics: {
    news: [{ name: "IEEE Spectrum Robotics", rss: "https://spectrum.ieee.org/feeds/tag/robotics" }],
    youtube: [
      { name: "Boston Dynamics", channelId: "UCOwTuBWoCvzLLM6GiTmKbRg" },
      ...UNIVERSAL_YT,
    ],
  },
  Hardware: {
    news: [{ name: "Tom's Hardware", rss: "https://www.tomshardware.com/feeds/all" }],
    youtube: UNIVERSAL_YT,
  },
  Aerospace: {
    news: [{ name: "SpaceNews", rss: "https://spacenews.com/feed/" }],
    youtube: [{ name: "Scott Manley", channelId: "UCxzC4EngIsMrPmbm6Nxvb-A" }, ...UNIVERSAL_YT],
  },

  // Medical / Health
  Medical: {
    news: [
      { name: "STAT News", rss: "https://www.statnews.com/feed/" },
      { name: "MedCity News", rss: "https://medcitynews.com/feed/" },
      { name: "Fierce Healthcare", rss: "https://www.fiercehealthcare.com/rss/xml" },
      { name: "TechCrunch Health", rss: "https://techcrunch.com/tag/health/feed/" },
    ],
    articles: [
      { name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" },
      { name: "Hugging Face (Medical AI)", rss: "https://huggingface.co/blog/feed.xml" },
    ],
    youtube: UNIVERSAL_YT,
  },
  Healthcare: {
    news: [
      { name: "STAT News", rss: "https://www.statnews.com/feed/" },
      { name: "MedCity News", rss: "https://medcitynews.com/feed/" },
      { name: "Fierce Healthcare", rss: "https://www.fiercehealthcare.com/rss/xml" },
      { name: "TechCrunch Health", rss: "https://techcrunch.com/tag/health/feed/" },
    ],
    articles: [
      { name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" },
      { name: "OpenAI Blog", rss: "https://openai.com/blog/rss.xml" },
    ],
    youtube: UNIVERSAL_YT,
  },
  Biotech: {
    news: [
      { name: "STAT News", rss: "https://www.statnews.com/feed/" },
      { name: "Fierce Biotech", rss: "https://www.fiercebiotech.com/rss/xml" },
    ],
    articles: [
      { name: "Nature Biotech", rss: "https://www.nature.com/nbt.rss" },
      { name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" },
    ],
    youtube: UNIVERSAL_YT,
  },
  Pharma: {
    news: [
      { name: "STAT News", rss: "https://www.statnews.com/feed/" },
      { name: "Fierce Pharma", rss: "https://www.fiercepharma.com/rss/xml" },
    ],
    articles: [{ name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" }],
    youtube: UNIVERSAL_YT,
  },
  "Mental Health": {
    news: [
      { name: "STAT News", rss: "https://www.statnews.com/feed/" },
      { name: "MedCity News", rss: "https://medcitynews.com/feed/" },
    ],
    articles: [{ name: "Psychology Today", rss: "https://www.psychologytoday.com/intl/articles/rss" }],
    youtube: UNIVERSAL_YT,
  },
  Genomics: {
    news: [{ name: "STAT News", rss: "https://www.statnews.com/feed/" }],
    articles: [
      { name: "Nature Genetics", rss: "https://www.nature.com/ng.rss" },
      { name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" },
    ],
    youtube: UNIVERSAL_YT,
  },

  // Business
  Founder: {
    news: [{ name: "TechCrunch", rss: "https://techcrunch.com/feed/" }],
    articles: [
      { name: "Y Combinator", rss: "https://www.ycombinator.com/blog/rss" },
      { name: "a16z", rss: "https://a16z.com/feed/" },
    ],
    youtube: [
      { name: "Y Combinator", channelId: "UCcefcZRL2oaA_uBNeo5UOWg" },
      { name: "Lex Fridman", channelId: "UCSHZKyawb77ixDdsGog4iWA" },
      ...UNIVERSAL_YT,
    ],
  },
  Startups: {
    articles: [
      { name: "Y Combinator", rss: "https://www.ycombinator.com/blog/rss" },
      { name: "a16z", rss: "https://a16z.com/feed/" },
    ],
    youtube: [{ name: "Y Combinator", channelId: "UCcefcZRL2oaA_uBNeo5UOWg" }, ...UNIVERSAL_YT],
  },
  Marketer: {
    articles: [
      { name: "HubSpot", rss: "https://blog.hubspot.com/marketing/rss.xml" },
      { name: "Ahrefs", rss: "https://ahrefs.com/blog/feed/" },
    ],
    youtube: UNIVERSAL_YT,
  },
  Marketing: {
    articles: [{ name: "HubSpot", rss: "https://blog.hubspot.com/marketing/rss.xml" }],
    youtube: UNIVERSAL_YT,
  },
  Finance: {
    news: [{ name: "Bloomberg Technology", rss: "https://feeds.bloomberg.com/technology/news.rss" }],
    youtube: [{ name: "Patrick Boyle", channelId: "UCASM0cgfkF_BhsgKlFasJRA" }, ...UNIVERSAL_YT],
  },
  Fintech: {
    news: [{ name: "TechCrunch Fintech", rss: "https://techcrunch.com/tag/fintech/feed/" }],
    youtube: UNIVERSAL_YT,
  },
  Crypto: {
    news: [
      { name: "CoinDesk", rss: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
      { name: "Decrypt", rss: "https://decrypt.co/feed" },
    ],
    youtube: [{ name: "Bankless", channelId: "UCAl9Ld79qaZxp9JzEOwd3aA" }, ...UNIVERSAL_YT],
  },
  Investing: {
    news: [{ name: "Seeking Alpha", rss: "https://feeds.seekingalpha.com/sa-top-news-feed" }],
    youtube: [{ name: "Patrick Boyle", channelId: "UCASM0cgfkF_BhsgKlFasJRA" }, ...UNIVERSAL_YT],
  },

  // Legal / Policy
  Law: {
    news: [{ name: "Law360", rss: "https://www.law360.com/rss/rss.xml" }],
    youtube: UNIVERSAL_YT,
  },
  "AI Regulation": {
    news: [
      { name: "VentureBeat AI", rss: "https://venturebeat.com/category/ai/feed/" },
      { name: "The Verge AI", rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
    ],
    youtube: UNIVERSAL_YT,
  },
  Security: {
    news: [
      { name: "Krebs on Security", rss: "https://krebsonsecurity.com/feed/" },
      { name: "Dark Reading", rss: "https://www.darkreading.com/rss.xml" },
    ],
    youtube: [{ name: "John Hammond", channelId: "UCVeW9qkBjo3zosnqUbG7CFw" }, ...UNIVERSAL_YT],
  },

  // Education
  Educator: {
    articles: [{ name: "EdSurge", rss: "https://www.edsurge.com/articles_rss" }],
    youtube: UNIVERSAL_YT,
  },
  EdTech: {
    articles: [{ name: "EdSurge", rss: "https://www.edsurge.com/articles_rss" }],
    youtube: UNIVERSAL_YT,
  },
  Student: {
    articles: UNIVERSAL_ARTICLES,
    youtube: UNIVERSAL_YT,
  },
  Researcher: {
    articles: [
      { name: "DeepMind", rss: "https://deepmind.google/blog/rss.xml" },
      { name: "Google AI Research", rss: "https://research.google/blog/rss/" },
    ],
    youtube: [
      { name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" },
      ...UNIVERSAL_YT,
    ],
  },

  // Science
  Science: {
    news: [{ name: "New Scientist", rss: "https://www.newscientist.com/feed/home/" }],
    articles: [{ name: "Nature News", rss: "https://www.nature.com/nature.rss" }],
    youtube: [{ name: "Kurzgesagt", channelId: "UCsXVk37bltHxD1rDPwtNM8Q" }, ...UNIVERSAL_YT],
  },
  Physics: {
    articles: [{ name: "Physics Today", rss: "https://pubs.aip.org/physicstoday/atom" }],
    youtube: [{ name: "PBS Space Time", channelId: "UC7_gcs09iThXybpVgjHZ_7g" }, ...UNIVERSAL_YT],
  },
  Climate: {
    news: [{ name: "Carbon Brief", rss: "https://www.carbonbrief.org/feed/" }],
    youtube: [{ name: "Our Changing Climate", channelId: "UCNXvxXpDJXp-mZu3pFMzYHQ" }, ...UNIVERSAL_YT],
  },
  Energy: {
    news: [{ name: "Canary Media", rss: "https://www.canarymedia.com/rss" }],
    youtube: UNIVERSAL_YT,
  },

  // Creative
  Art: {
    news: [{ name: "Artnet", rss: "https://news.artnet.com/feed" }],
    youtube: [{ name: "Proko", channelId: "UClM2LuQ1q5WEc9on9gd7oFKAg" }, ...UNIVERSAL_YT],
  },
  Film: {
    news: [{ name: "IndieWire", rss: "https://www.indiewire.com/feed/" }],
    youtube: [{ name: "Every Frame a Painting", channelId: "UCjFqcJQXGZ6T8IQMX7we4FA" }, ...UNIVERSAL_YT],
  },
  Music: {
    news: [{ name: "Pitchfork", rss: "https://pitchfork.com/rss/news/" }],
    youtube: UNIVERSAL_YT,
  },
  Writing: {
    articles: [{ name: "The Atlantic", rss: "https://feeds.theatlantic.com/TheAtlantic/all" }],
    youtube: UNIVERSAL_YT,
  },
  Gaming: {
    news: [
      { name: "Polygon", rss: "https://www.polygon.com/rss/index.xml" },
      { name: "PC Gamer", rss: "https://www.pcgamer.com/rss/" },
    ],
    youtube: [{ name: "NVIDIA GeForce", channelId: "UCYMGxYARNMoaGRSjRKXKM4g" }, ...UNIVERSAL_YT],
  },
  "VR/AR": {
    news: [{ name: "Road to VR", rss: "https://www.roadtovr.com/feed/" }],
    youtube: UNIVERSAL_YT,
  },

  // AI / Tech specific
  Productivity: {
    articles: [
      { name: "Zapier Blog", rss: "https://zapier.com/blog/feeds/latest/" },
      { name: "Notion Blog", rss: "https://www.notion.so/blog/rss.xml" },
    ],
    youtube: [{ name: "Thomas Frank", channelId: "UCG-KntY7aVnIGXYEBQvmBAQ" }, ...UNIVERSAL_YT],
  },
  Automation: {
    articles: [{ name: "Zapier Blog", rss: "https://zapier.com/blog/feeds/latest/" }],
    youtube: UNIVERSAL_YT,
  },
  Agents: {
    news: UNIVERSAL_NEWS,
    articles: [
      { name: "OpenAI Blog", rss: "https://openai.com/blog/rss.xml" },
      { name: "Anthropic", rss: "https://www.anthropic.com/news/rss.xml" },
    ],
    youtube: UNIVERSAL_YT,
  },
  "Generative AI": {
    news: UNIVERSAL_NEWS,
    articles: UNIVERSAL_ARTICLES,
    youtube: UNIVERSAL_YT,
  },
  LLMs: {
    news: UNIVERSAL_NEWS,
    articles: [
      { name: "Hugging Face", rss: "https://huggingface.co/blog/feed.xml" },
      { name: "DeepMind", rss: "https://deepmind.google/blog/rss.xml" },
    ],
    youtube: [{ name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" }, ...UNIVERSAL_YT],
  },
  "Computer Vision": {
    articles: [
      { name: "DeepMind", rss: "https://deepmind.google/blog/rss.xml" },
      { name: "OpenAI Blog", rss: "https://openai.com/blog/rss.xml" },
    ],
    youtube: [{ name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" }, ...UNIVERSAL_YT],
  },
  "Voice AI": {
    news: UNIVERSAL_NEWS,
    articles: UNIVERSAL_ARTICLES,
    youtube: UNIVERSAL_YT,
  },

  // Fallback for everything not specifically mapped
  Other: {
    news: UNIVERSAL_NEWS,
    articles: UNIVERSAL_ARTICLES,
    youtube: UNIVERSAL_YT,
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Hacker News topic search — reliably returns results server-side */
function hackerNewsFeed(interests: string[]): { name: string; rss: string } {
  const query = interests.slice(0, 3).join(" OR ");
  return {
    name: "Hacker News",
    rss: `https://hnrss.org/newest?q=${encodeURIComponent(query)}&points=20`,
  };
}

/** Medium tag RSS — articles from Medium by topic */
function mediumFeed(interest: string): { name: string; rss: string } {
  const slug = slugify(interest) || "artificial-intelligence";
  return {
    name: `Medium · ${interest}`,
    rss: `https://medium.com/feed/tag/${slug}`,
  };
}

/** Dev.to tag RSS — developer articles */
function devToFeed(interest: string): { name: string; rss: string } {
  const slug = slugify(interest) || "ai";
  return {
    name: `Dev.to · ${interest}`,
    rss: `https://dev.to/feed/tag/${slug}`,
  };
}

export function getClientSources(interests: string[]): ClientSources {
  const merged: ClientSources = { news: [], articles: [], youtube: [] };
  const seenNews = new Set<string>();
  const seenArticles = new Set<string>();
  const seenYt = new Set<string>();

  const add = (sources: Partial<ClientSources>) => {
    for (const n of sources.news ?? []) {
      if (!seenNews.has(n.rss)) {
        seenNews.add(n.rss);
        merged.news.push(n);
      }
    }
    for (const a of sources.articles ?? []) {
      if (!seenArticles.has(a.rss)) {
        seenArticles.add(a.rss);
        merged.articles.push(a);
      }
    }
    for (const y of sources.youtube ?? []) {
      if (!seenYt.has(y.channelId)) {
        seenYt.add(y.channelId);
        merged.youtube.push(y);
      }
    }
  };

  for (const interest of interests) {
    const src = SOURCE_MAP[interest];
    if (src) add(src);
  }

  // Interest-tailored feeds (Hacker News search + Medium + Dev.to)
  if (interests.length > 0) {
    const hn = hackerNewsFeed(interests);
    if (!seenNews.has(hn.rss)) {
      seenNews.add(hn.rss);
      merged.news.unshift(hn);
    }

    for (const interest of interests.slice(0, 3)) {
      const med = mediumFeed(interest);
      if (!seenArticles.has(med.rss)) {
        seenArticles.add(med.rss);
        merged.articles.unshift(med);
      }
      const dev = devToFeed(interest);
      if (!seenArticles.has(dev.rss)) {
        seenArticles.add(dev.rss);
        merged.articles.push(dev);
      }
    }
  }

  // Universal fallbacks so feed is never empty
  add({ news: UNIVERSAL_NEWS, articles: UNIVERSAL_ARTICLES, youtube: UNIVERSAL_YT });

  return merged;
}
