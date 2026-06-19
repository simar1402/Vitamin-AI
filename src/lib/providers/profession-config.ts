/**
 * Profession-first configuration for Vitamin-AI.
 *
 * Each profession defines:
 *   - id          Machine key (used everywhere in the system)
 *   - label       Display name
 *   - tools       Specific AI tools this profession uses
 *   - anchors     Domain-specific terms for relevance scoring
 *   - queries     Search queries for HN / YouTube API
 *   - newsFeeds   Curated RSS feeds (AI × profession)
 *   - articleTags Medium/Dev.to tags
 *   - ytChannels  YouTube channel IDs
 */

export type ProfessionId =
  | "product-manager"
  | "software-engineer"
  | "product-designer"
  | "content-designer"
  | "doctor"
  | "teacher"
  | "sales"
  | "entrepreneur"
  | "lawyer";

export interface ProfessionConfig {
  id: ProfessionId;
  label: string;
  emoji: string;
  desc: string;
  /** AI tools specific to this profession */
  tools: string[];
  /** Domain anchor terms for relevance scoring — must appear in content */
  anchors: string[];
  /** Search queries for HN/YouTube */
  queries: string[];
  /** Curated RSS news feeds */
  newsFeeds: { name: string; rss: string }[];
  /** Medium / Dev.to article tags */
  articleTags: string[];
  /** YouTube channels */
  ytChannels: { name: string; channelId: string }[];
}

/** Hacker News RSS — AI-first query, min 10 points */
function hn(name: string, query: string, points = 10): { name: string; rss: string } {
  return {
    name,
    rss: `https://hnrss.org/newest?q=${encodeURIComponent(query)}&points=${points}`,
  };
}

export const PROFESSIONS: ProfessionConfig[] = [
  // ── Product Manager ──────────────────────────────────────────────────────
  {
    id: "product-manager",
    label: "Product Manager",
    emoji: "📋",
    desc: "AI for product strategy, roadmaps & analytics",
    tools: [
      "productboard ai", "jira ai", "notion ai", "linear ai",
      "amplitude ai", "mixpanel ai", "chatgpt", "claude", "gemini",
    ],
    anchors: [
      "product manager", "product management", "product strategy", "roadmap",
      "feature prioritization", "product analytics", "product discovery",
      "user research", "product-led growth", "plg", "saas ai", "ai copilot",
      "ai agent", "llm application", "customer feedback", "product growth",
      "ai features", "product roadmap", "backlog", "stakeholder", "kpi",
      "north star metric", "activation", "retention", "churn",
    ],
    queries: [
      "AI product management",
      "AI product strategy 2025",
      "AI roadmap tool",
      "product analytics AI",
      "AI product discovery",
      "LLM product management",
    ],
    newsFeeds: [
      hn("HN · AI Product Mgmt", "AI product management OR AI roadmap OR product analytics AI", 15),
      hn("HN · AI PM Tools", "Productboard AI OR Jira AI OR Linear AI OR Notion AI product", 12),
      hn("HN · AI PLG", "AI product-led growth OR AI feature launch SaaS OR LLM product management", 10),
    ],
    articleTags: ["ai-product-management", "product-management", "ai-product", "product-strategy", "saas-ai"],
    ytChannels: [
      { name: "Lenny's Podcast",    channelId: "UCV64lVgOfH0ej44g7OJPqXA" },
      { name: "Matt Wolfe",         channelId: "UChpleBmo18P08aKCIgti38g" },
      { name: "AI Explained",       channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
      { name: "Wes Roth",           channelId: "UCnzNE-AAIhWPZWDMpADFJZQ" },
    ],
  },

  // ── Software Engineer ────────────────────────────────────────────────────
  {
    id: "software-engineer",
    label: "Software Engineer",
    emoji: "💻",
    desc: "AI coding tools, agents & developer productivity",
    tools: [
      "cursor", "github copilot", "claude code", "windsurf", "replit",
      "devin", "openai api", "anthropic api", "langchain", "vercel ai sdk",
    ],
    anchors: [
      "cursor", "github copilot", "claude code", "windsurf", "devin",
      "ai coding", "coding assistant", "ai developer", "llm engineering",
      "mcp", "model context protocol", "rag", "retrieval augmented",
      "ai infrastructure", "developer tools", "ai framework", "agentic",
      "multi-agent", "code generation", "prompt engineering", "software engineer",
      "ai agent", "langchain", "vercel ai", "openai api", "anthropic api",
      "ai automation", "devtools", "ai ide",
    ],
    queries: [
      "AI coding assistant 2025",
      "Cursor AI editor",
      "GitHub Copilot update",
      "LLM engineering tutorial",
      "AI agent developer tools",
      "MCP model context protocol",
    ],
    newsFeeds: [
      hn("HN · AI Coding", "Cursor AI OR GitHub Copilot OR Claude Code OR AI coding assistant", 15),
      hn("HN · LLM Engineering", "LLM engineering OR AI agent developer OR MCP OR RAG pipeline", 15),
      hn("HN · AI DevTools", "AI developer tools OR AI software engineering OR AI code generation", 12),
    ],
    articleTags: ["ai-tools", "llm", "coding-ai", "github-copilot", "ai-agents", "langchain", "developer-tools"],
    ytChannels: [
      { name: "Fireship",           channelId: "UCsBjURrPoezykLs9EqgamOA" },
      { name: "Theo",               channelId: "UCbXgNpp0jedKWcQiDsBbX5Q" },
      { name: "Yannic Kilcher",     channelId: "UCZHmQk67mSJgfCCTn7xBfew" },
      { name: "AI Explained",       channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
      { name: "Matthew Berman",     channelId: "UCnUYZLuoy1rq1aVMwx4aTzw" },
    ],
  },

  // ── Product Designer ─────────────────────────────────────────────────────
  {
    id: "product-designer",
    label: "Product Designer",
    emoji: "🎨",
    desc: "AI for UX, UI design & creative workflows",
    tools: [
      "figma ai", "galileo ai", "relume", "v0", "lovable",
      "framer ai", "midjourney", "claude", "chatgpt",
    ],
    anchors: [
      "figma ai", "galileo ai", "relume", "framer ai", "v0 design",
      "ai ux", "ai ui", "ai product design", "ux design", "ui design",
      "design system", "generative ui", "ux research", "design automation",
      "human-ai interaction", "prototyping", "interaction design",
      "conversational interface", "ai design tool", "design workflow",
      "midjourney", "ai wireframe", "ai prototype", "designer",
    ],
    queries: [
      "AI UX design tools 2025",
      "Figma AI features",
      "generative UI AI",
      "AI product design workflow",
      "AI prototyping tools",
      "AI design system",
    ],
    newsFeeds: [
      hn("HN · AI Design", "Figma AI OR AI UX design OR generative UI OR AI design tool", 12),
      hn("HN · AI Prototyping", "AI prototyping OR v0 design OR Galileo AI OR Framer AI", 12),
      hn("HN · AI Product Design", "AI product design OR AI design workflow OR AI design systems UX", 10),
    ],
    articleTags: ["ai-design", "figma-ai", "ux-design", "generative-ui", "ai-ux", "design-systems", "product-design"],
    ytChannels: [
      { name: "DesignCourse",       channelId: "UCVyRiMvfUNMA1UPlDPzG5Ow" },
      { name: "Flux",               channelId: "UCdFRvwde9cmdVmXlyPPJUTg" },
      { name: "Matt Wolfe",         channelId: "UChpleBmo18P08aKCIgti38g" },
      { name: "Wes Roth",           channelId: "UCnzNE-AAIhWPZWDMpADFJZQ" },
    ],
  },

  // ── Doctor ───────────────────────────────────────────────────────────────
  {
    id: "doctor",
    label: "Doctor",
    emoji: "🏥",
    desc: "AI in clinical practice, diagnostics & medical research",
    tools: [
      "nuance dax", "pathai", "aidoc", "viz.ai", "med-palm",
      "google med-palm", "epic ai", "ambient clinical intelligence",
    ],
    anchors: [
      "nuance dax", "pathai", "aidoc", "viz.ai", "med-palm",
      "healthcare ai", "medical ai", "clinical ai", "ai diagnosis",
      "ai diagnostics", "radiology ai", "drug discovery ai",
      "medical research ai", "precision medicine", "healthcare automation",
      "electronic health records", "ehr ai", "clinical decision support",
      "medical imaging ai", "patient care ai", "ai pathology",
      "ai genomics", "ai surgery", "ai clinical trial", "fda ai",
      "ai hospital", "ai physician", "ai doctor",
    ],
    queries: [
      "AI healthcare diagnosis 2025",
      "clinical AI tools doctors",
      "AI medical imaging radiology",
      "AI drug discovery 2025",
      "FDA AI medical device",
      "AI electronic health records",
    ],
    newsFeeds: [
      hn("HN · Medical AI", "AI healthcare diagnosis OR AI medical imaging OR clinical AI doctors", 12),
      hn("HN · Healthcare AI", "AI drug discovery OR AI radiology OR AI pathology OR AI EHR", 12),
      hn("HN · Clinical AI", "FDA AI medical device OR AI clinical decision support OR healthcare AI regulation", 10),
    ],
    articleTags: ["healthcare-ai", "medical-ai", "clinical-ai", "ai-diagnosis", "health-tech", "medtech"],
    ytChannels: [
      { name: "AI Explained",       channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
      { name: "Two Minute Papers",  channelId: "UCbfYPyITQ-7l4upoX8nvctg" },
      { name: "Wes Roth",           channelId: "UCnzNE-AAIhWPZWDMpADFJZQ" },
      { name: "Dr. Jubbal (MedMD)", channelId: "UCDs7JHjWcKe4sCUvs2-KCBQ" },
    ],
  },

  // ── Teacher ──────────────────────────────────────────────────────────────
  {
    id: "teacher",
    label: "Teacher",
    emoji: "📚",
    desc: "AI tools for educators, personalized learning & classrooms",
    tools: [
      "khanmigo", "chatgpt education", "gemini for education",
      "magicschool ai", "quizizz ai", "canva ai",
    ],
    anchors: [
      "khan academy", "khanmigo", "magicschool ai", "quizizz ai",
      "ai education", "ai teaching", "ai classroom", "ai learning",
      "personalized learning ai", "adaptive learning ai", "edtech ai",
      "ai tutoring", "ai curriculum", "ai lesson plan", "ai assessment",
      "ai student", "learning analytics ai", "ai teacher", "educator ai",
      "ai school", "ai in schools", "ai university", "teaching workflow ai",
      "edtech layoffs", "education layoffs", "ai in schools", "school ai policy",
      "gemini for education", "chatgpt for teachers", "classroom", "education",
    ],
    queries: [
      "AI education tools teachers 2025",
      "AI personalized learning",
      "AI classroom tools",
      "AI lesson planning",
      "AI assessment education",
      "EdTech AI 2025",
    ],
    newsFeeds: [
      hn("HN · AI Education", "AI education OR AI tutoring OR AI classroom OR Khanmigo teachers", 12),
      hn("HN · EdTech AI", "EdTech AI OR AI teacher OR AI lesson plan OR MagicSchool AI", 12),
      hn("HN · AI Learning", "AI personalized learning OR AI assessment education OR AI curriculum schools", 10),
    ],
    articleTags: ["ai-education", "edtech", "ai-learning", "personalized-learning", "ai-classroom", "teaching-ai"],
    ytChannels: [
      { name: "AI Explained",       channelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
      { name: "Matt Wolfe",         channelId: "UChpleBmo18P08aKCIgti38g" },
      { name: "Common Sense Education", channelId: "UCiB8h9jD2Mlxx96ZFnGDSGw" },
    ],
  },

  // ── Business Development & Sales ─────────────────────────────────────────
  {
    id: "sales",
    label: "Business Development & Sales",
    emoji: "📈",
    desc: "AI for sales, prospecting & revenue growth",
    tools: [
      "clay", "apollo", "apollo.io", "gong", "gong.io", "hubspot", "hubspot ai",
      "salesforce", "salesforce einstein", "salesforce ai", "outreach", "outreach.io",
      "zoominfo", "clari", "lavender", "11x", "amplemarket", "salesloft",
      "chorus", "cognism", "lusha", "seamless.ai", "linkedin sales navigator",
      "notion", "atlassian",
    ],
    anchors: [
      // Tools (strong signals)
      "clay", "gong", "clari", "outreach", "apollo", "zoominfo", "salesloft",
      "salesforce", "hubspot", "11x", "lavender", "amplemarket",
      // Core job titles / roles
      "sdr", "bdr", "ae", "account executive", "sales rep", "sales development",
      "business development", "revenue team", "gtm team", "sales leader",
      "vp of sales", "chief revenue officer", "cro", "sales ops",
      // Topics — sales workflows
      "sales automation", "sales ai", "ai sales", "ai for sales",
      "revenue intelligence", "revenue operations", "revops",
      "pipeline management", "pipeline ai", "sales pipeline",
      "lead generation", "lead gen", "prospecting ai", "outbound sales",
      "inbound sales", "account-based marketing", "abm", "abm ai",
      "sales enablement", "sales productivity", "sales forecasting",
      "crm ai", "crm automation", "sales engagement",
      "cold outreach", "cold email ai", "email personalization",
      "b2b sales", "b2b ai", "enterprise sales", "smb sales",
      "go-to-market", "gtm strategy", "gtm ai",
      "customer success ai", "churn prediction", "upsell ai",
      "deal intelligence", "conversation intelligence",
      "ai agent for sales", "ai sdr", "ai bdr",
      "quota attainment", "win rate", "sales cycle",
    ],
    queries: [
      "AI sales tools 2025",
      "AI SDR BDR automation",
      "revenue intelligence AI Gong Clari",
      "AI lead generation B2B outbound",
      "GTM strategy AI startup",
      "AI CRM Salesforce HubSpot automation",
      "sales automation Clay Apollo ZoomInfo",
      "AI sales agent 11x Amplemarket",
    ],
    newsFeeds: [
      hn("HN · AI Sales Tools", "AI sales OR AI SDR OR Gong AI OR Clay AI sales automation", 10),
      hn("HN · AI GTM", "AI go-to-market OR revenue intelligence AI OR Salesforce AI OR HubSpot AI", 10),
      hn("HN · Sales Automation", "AI lead generation OR AI prospecting OR AI cold email sales", 10),
      hn("HN · RevOps AI", "revenue operations AI OR sales forecasting AI OR pipeline AI", 10),
    ],
    articleTags: [
      "ai-sales", "sales-automation", "revenue-intelligence", "crm-ai",
      "b2b-sales", "ai-gtm", "sales-ai", "outbound-sales", "lead-generation",
      "revenue-operations", "sales-enablement", "ai-prospecting",
    ],
    ytChannels: [
      { name: "Gong",                           channelId: "UCYWrNEL35ocP3vDM7B77Spw" },
      { name: "HubSpot",                        channelId: "UCaAx1xeTgF3rs4rBPDq6-Kw" },
      { name: "Salesforce",                     channelId: "UCUpquzY878NEaZm5bc7m2sQ" },
      { name: "30 Minutes to President's Club", channelId: "UCku-dqryeYBuzh_0xVKPExw" },
      { name: "Alex Hormozi",                   channelId: "UCUyDOdBWhC1MCxEjC46d-zw" },
    ],
  },

  // ── Entrepreneur ─────────────────────────────────────────────────────────
  {
    id: "entrepreneur",
    label: "Entrepreneur",
    emoji: "🚀",
    desc: "AI for founders, startups & building products fast",
    tools: [
      "lovable", "bolt", "cursor", "replit", "claude", "chatgpt",
      "perplexity", "midjourney", "v0",
    ],
    anchors: [
      "lovable", "bolt.new", "replit ai", "perplexity",
      "ai startup", "ai business", "ai entrepreneur", "no-code ai",
      "ai founder", "startup automation", "founder productivity ai",
      "ai opportunities", "venture capital ai", "startup growth ai",
      "indie hacker ai", "ai saas", "saas startup", "bootstrapping ai",
      "ai business model", "ai product launch", "vibe coding",
      "ai app builder", "ai mvp",
    ],
    queries: [
      "AI startup tools 2025",
      "AI founder productivity",
      "no-code AI app builder",
      "AI business model 2025",
      "AI SaaS startup",
      "vibe coding Lovable Bolt",
    ],
    newsFeeds: [
      hn("HN · AI Startups", "AI startup OR vibe coding OR Lovable AI OR Bolt AI founder", 15),
      hn("HN · AI Founder", "AI founder tools OR AI SaaS OR AI business model startup", 12),
      hn("HN · AI Entrepreneurship", "AI entrepreneur OR no-code AI OR AI product launch startup", 10),
    ],
    articleTags: ["ai-startup", "no-code-ai", "founder-ai", "saas-ai", "ai-business", "entrepreneurship-ai"],
    ytChannels: [
      { name: "Y Combinator",     channelId: "UCcefcZRL2oaA_uBNeo5UOWg" },
      { name: "Greg Isenberg",    channelId: "UCPjNBjflYl0-HQtUvOx0Ibw" },
      { name: "Lenny's Podcast",  channelId: "UC6t1O76G0jYXOAoYCm153dA" },
      { name: "a16z",             channelId: "UC9cn0TuPq4dnbTY-CBsm8XA" },
      { name: "Fireship",         channelId: "UCsBjURrPoezykLs9EqgamOA" },
    ],
  },

  // ── Lawyer ───────────────────────────────────────────────────────────────
  {
    id: "lawyer",
    label: "Law",
    emoji: "⚖️",
    desc: "AI for legal research, contracts & regulation",
    tools: [
      "harvey", "cocounsel", "lexis+ ai", "westlaw ai",
      "casetext", "spellbook",
    ],
    anchors: [
      "harvey ai", "cocounsel", "lexis ai", "westlaw ai", "casetext", "spellbook",
      "legal ai", "ai legal", "contract review ai", "legal research ai",
      "compliance ai", "regulatory technology", "regtech",
      "ai governance", "ai regulation", "intellectual property ai",
      "corporate law ai", "legal automation", "legal operations ai",
      "legaltech", "ai law", "eu ai act", "gdpr ai", "ftc ai",
      "ai liability", "ai policy", "ai ethics law",
    ],
    queries: [
      "AI legal tools lawyers 2025",
      "Harvey AI legal research",
      "AI contract review",
      "AI compliance regulatory",
      "EU AI Act legal",
      "LegalTech AI 2025",
    ],
    newsFeeds: [
      hn("HN · AI Legal", "AI legal OR Harvey AI OR AI contract review OR LegalTech lawyers", 12),
      hn("HN · AI Regulation", "AI regulation OR EU AI Act OR AI governance OR AI compliance law", 12),
      hn("HN · Legal AI", "AI legal research OR AI law firms OR AI litigation technology", 10),
    ],
    articleTags: ["legaltech", "ai-legal", "ai-regulation", "ai-governance", "contract-ai", "legal-ai"],
    ytChannels: [
      { name: "Bloomberg Law",       channelId: "UCJL_gIOVp2fjfsKH4kbeEwA" },
      { name: "Legal Talk Network",  channelId: "UCASCCyql5OF5wpGoPDyNOQA" },
      { name: "Harvard Law School",  channelId: "UCBcn1VNOJUsPNrsCJGTcquw" },
      { name: "Stanford Law School", channelId: "UCK8Ar8dzFbKIJiALebDysUQ" },
    ],
  },

  // ── Content Writer (content-designer) ───────────────────────────────────────
  {
    id: "content-designer",
    label: "Content Writer",
    emoji: "✍️",
    desc: "AI for UX writing, copywriting, content strategy & documentation",
    tools: [
      "chatgpt", "claude", "jasper ai", "copy.ai", "writer ai", "grammarly ai",
      "wordtune", "notion ai", "lex", "anyword", "writesonic", "surfer seo",
    ],
    anchors: [
      "content writer", "content writing", "ux writer", "ux writing",
      "copywriter", "copywriting", "technical writer", "technical writing",
      "content strategist", "content strategy", "microcopy", "product copy",
      "marketing copy", "brand voice", "voice and tone", "style guide",
      "editorial", "headline", "blog writing", "newsletter writing",
      "documentation", "help center", "knowledge base", "api documentation",
      "plain language", "readability", "information architecture",
      "content design", "content designer", "content operations", "content audit",
      "ai writing", "ai copywriting", "ai content", "ai ux writing",
      "ai documentation", "error message copy", "onboarding copy", "cta copy",
      "seo content", "content marketing ai",
    ],
    queries: [
      "AI content writing tools 2025",
      "AI UX writing copywriting",
      "AI technical writing documentation",
      "AI content strategy workflow",
      "AI microcopy product copy",
      "Jasper Writer Grammarly AI writing",
      "AI blog writing marketing copy",
    ],
    newsFeeds: [
      hn("HN · AI Content Writing", "AI content writing OR AI copywriting OR AI UX writing OR technical writing AI", 12),
      hn("HN · AI UX Writing", "AI UX writing OR AI microcopy OR AI product copy OR content design AI", 12),
      hn("HN · AI Documentation", "AI technical writing OR AI documentation OR AI help center OR AI style guide writing", 10),
      hn("HN · Writing AI Tools", "Jasper AI OR Writer AI OR Grammarly AI OR Copy.ai content writing", 10),
    ],
    articleTags: [
      "content-writing", "ux-writing", "copywriting", "technical-writing",
      "content-strategy", "ai-writing", "ai-copywriting", "content-design",
    ],
    ytChannels: [
      { name: "NN/g",                  channelId: "UC2oCugzU6W8-h95W7eBTUEg" },
      { name: "UX Content Collective", channelId: "UCZoF29d32itjXWZvzsM5y0A" },
      { name: "Grammarly",             channelId: "UCfmqLyr1PI3_zbwppHNEzuQ" },
      { name: "Jasper",                channelId: "UCJKYBgFQoE9appKOs5HAIyQ" },
      { name: "Copyblogger",           channelId: "UCK1xA5o_4Cliy4Q4ltTq8dw" },
      { name: "Ann Handley",           channelId: "UCKOnl6ZCJB_gfjgEVxHt9MQ" },
      { name: "Ahrefs",                channelId: "UCWquNQV8Y0_defMKnGKrFOQ" },
      { name: "WordTune",              channelId: "UCMgBA0tnhCty_v_CsRfPfbw" },
    ],
  },
];

/** Look up a profession by ID */
export function getProfession(id: string): ProfessionConfig | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

/** Convert a profession ID to the industry key the provider system understands */
export function professionToIndustryKey(id: string): string {
  const MAP: Record<string, string> = {
    "product-manager":   "Product Manager",
    "software-engineer": "Software Engineer",
    "product-designer":  "Product Designer",
    "content-designer":  "Content Writer",
    "doctor":            "Doctor",
    "teacher":           "Teacher",
    "sales":             "Sales",
    "entrepreneur":      "Entrepreneur",
    "lawyer":            "Lawyer",
  };
  return MAP[id] ?? id;
}
