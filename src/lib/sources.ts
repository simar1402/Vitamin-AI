// Industry-aware source map. Pure config — server-safe.
// Each profession maps to: search keywords (for Google News + Reddit),
// curated blog RSS feeds (Articles), and YouTube channel IDs (Videos).

export interface Sources {
  keywords: string[];
  blogs: { name: string; rss: string }[];
  youtube: { name: string; channelId: string }[];
  // Direct publisher news RSS feeds (avoids Google News wrapper URLs that
  // many networks block as ERR_BLOCKED_BY_RESPONSE).
  news?: { name: string; rss: string }[];
}

// Universal "AI news" feeds with clean publisher URLs (no Google News wrapper).
const UNIVERSAL_NEWS: Sources["news"] = [
  { name: "TechCrunch AI", rss: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "VentureBeat AI", rss: "https://venturebeat.com/category/ai/feed/" },
  { name: "Ars Technica AI", rss: "https://arstechnica.com/ai/feed/" },
  { name: "Wired AI", rss: "https://www.wired.com/feed/tag/ai/latest/rss" },
  { name: "MIT Tech Review AI", rss: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
];



// Universal AI sources every profession sees a bit of.
const UNIVERSAL_BLOGS: Sources["blogs"] = [
  { name: "OpenAI", rss: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic", rss: "https://www.anthropic.com/news/rss.xml" },
  { name: "Google AI", rss: "https://blog.google/technology/ai/rss/" },
  { name: "Hugging Face", rss: "https://huggingface.co/blog/feed.xml" },
  { name: "Microsoft AI", rss: "https://blogs.microsoft.com/ai/feed/" },
  { name: "NVIDIA AI", rss: "https://blogs.nvidia.com/blog/category/deep-learning/feed/" },
  { name: "MIT Tech Review AI", rss: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
];

const UNIVERSAL_YT: Sources["youtube"] = [
  { name: "Two Minute Papers", channelId: "UCbfYPyITQ-7l4upoX8nvctg" },
  { name: "AI Explained", channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
  { name: "Matt Wolfe", channelId: "UChpleBmo18P08aKCIgti38g" },
];

export const PROFESSION_SOURCES: Record<string, Sources> = {
  Designer: {
    keywords: ["AI design tools", "Figma AI", "UX AI", "generative UI", "AI design workflow"],
    blogs: [
      { name: "Figma Blog", rss: "https://www.figma.com/blog/rss/" },
      { name: "UX Collective", rss: "https://uxdesign.cc/feed" },
      { name: "Adobe Blog", rss: "https://blog.adobe.com/en/topics/artificial-intelligence.atom" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: [
      { name: "DesignCourse", channelId: "UCVyRiMvfUNMA1UPlDPzG5Ow" },
      ...UNIVERSAL_YT,
    ],

  },
  Developer: {
    keywords: ["AI coding", "AI agents", "Cursor AI", "GitHub Copilot", "AI software engineering", "LLM", "developer tools"],
    news: [
      { name: "Hacker News Front Page", rss: "https://hnrss.org/frontpage?points=150" },
      { name: "Hacker News · AI", rss: "https://hnrss.org/newest?q=AI+OR+LLM+OR+Copilot+OR+Cursor&points=50" },
      { name: "The Verge AI", rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
      { name: "Ars Technica AI", rss: "https://arstechnica.com/ai/feed/" },
      { name: "TechCrunch AI", rss: "https://techcrunch.com/category/artificial-intelligence/feed/" },
    ],
    blogs: [
      { name: "GitHub Blog", rss: "https://github.blog/feed/" },
      { name: "Vercel", rss: "https://vercel.com/atom" },
      { name: "Stripe Engineering", rss: "https://stripe.com/blog/engineering.rss" },
      { name: "Cloudflare", rss: "https://blog.cloudflare.com/rss/" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: [
      { name: "Fireship", channelId: "UCsBjURrPoezykLs9EqgamOA" },
      { name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" },
      ...UNIVERSAL_YT,
    ],
  },
  Founder: {
    keywords: ["AI startup", "AI product launch", "AI funding", "YC AI", "generative AI startup"],
    blogs: [
      { name: "Y Combinator", rss: "https://www.ycombinator.com/blog/rss" },
      { name: "a16z", rss: "https://a16z.com/feed/" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: [
      { name: "Y Combinator", channelId: "UCcefcZRL2oaA_uBNeo5UOWg" },
      { name: "Lex Fridman", channelId: "UCSHZKyawb77ixDdsGog4iWA" },
      ...UNIVERSAL_YT,
    ],
  },
  Marketer: {
    keywords: ["AI marketing", "AI SEO", "content automation AI", "growth marketing AI", "GEO AI search"],
    blogs: [
      { name: "HubSpot", rss: "https://blog.hubspot.com/marketing/rss.xml" },
      { name: "Ahrefs", rss: "https://ahrefs.com/blog/feed/" },
      { name: "Semrush", rss: "https://www.semrush.com/blog/feed/" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: UNIVERSAL_YT,

  },
  Researcher: {
    keywords: ["arxiv AI", "AI research paper", "LLM benchmark", "machine learning research"],
    blogs: [
      { name: "DeepMind", rss: "https://deepmind.google/blog/rss.xml" },
      { name: "BAIR", rss: "https://bair.berkeley.edu/blog/feed.xml" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: [
      { name: "Yannic Kilcher", channelId: "UCZHmQk67mSJgfCCTn7xBfew" },
      ...UNIVERSAL_YT,
    ],
  },
  "Product Manager": {
    keywords: ["AI product management", "AI roadmap", "LLM product", "PM AI tools"],
    blogs: [
      { name: "Lenny's Newsletter", rss: "https://www.lennysnewsletter.com/feed" },
      { name: "Reforge", rss: "https://www.reforge.com/blog/rss.xml" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: UNIVERSAL_YT,
  },
  Writer: {
    keywords: ["AI writing tools", "AI content", "LLM writing", "AI journalism"],
    blogs: [
      { name: "The Verge AI", rss: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: UNIVERSAL_YT,
  },
  Educator: {
    keywords: ["AI in education", "AI teaching", "AI tutor", "edtech AI"],
    blogs: [
      { name: "EdSurge", rss: "https://www.edsurge.com/articles_rss" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: UNIVERSAL_YT,
  },
  Student: {
    keywords: ["AI learning", "AI student tools", "study AI", "AI tutor"],
    blogs: UNIVERSAL_BLOGS,
    youtube: UNIVERSAL_YT,
  },
  Consultant: {
    keywords: ["enterprise AI", "AI strategy", "AI transformation", "Gartner AI"],
    blogs: [
      { name: "McKinsey AI", rss: "https://www.mckinsey.com/featured-insights/artificial-intelligence/rss" },
      { name: "BCG", rss: "https://www.bcg.com/rss/insights" },
      ...UNIVERSAL_BLOGS,
    ],
    youtube: UNIVERSAL_YT,
  },
  Analyst: {
    keywords: ["AI market", "AI report", "AI analytics", "data analytics AI"],
    blogs: UNIVERSAL_BLOGS,
    youtube: UNIVERSAL_YT,
  },
  Other: {
    keywords: ["AI news", "AI tools", "generative AI", "LLM"],
    blogs: UNIVERSAL_BLOGS,
    youtube: UNIVERSAL_YT,
  },
};

// Medical / Healthcare (PROFESSIONS list doesn't include it by default, but
// the user explicitly called it out — keep an alias so it works if added).
PROFESSION_SOURCES["Medical"] = {
  keywords: ["healthcare AI", "medical AI", "clinical AI", "AI diagnostics", "FDA AI approval"],
  blogs: [
    { name: "Nature Medicine", rss: "https://www.nature.com/nm.rss" },
    { name: "STAT News", rss: "https://www.statnews.com/feed/" },
    ...UNIVERSAL_BLOGS,
  ],
  youtube: UNIVERSAL_YT,
};

export function getSourcesFor(profession: string) {
  const s = PROFESSION_SOURCES[profession] ?? PROFESSION_SOURCES.Other;
  const news = (s.news && s.news.length > 0 ? s.news : UNIVERSAL_NEWS) as { name: string; rss: string }[];
  return { keywords: s.keywords, blogs: s.blogs, youtube: s.youtube, news };
}
