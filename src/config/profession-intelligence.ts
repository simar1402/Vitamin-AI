/**
 * Profession Intelligence Configuration
 *
 * Defines rich AI signal data per profession for YouTube video discovery.
 * Each profession maps to: tools, companies, workflows, use-cases, topics,
 * startups, and high-quality curated YouTube channels.
 *
 * The query builder generates 20–30 targeted queries per profession,
 * sitting at the intersection of  Profession × AI.
 */

export interface ProfessionIntelligence {
  id: string;
  aiTools: string[];
  aiCompanies: string[];
  aiWorkflows: string[];
  aiUseCases: string[];
  aiTopics: string[];
  aiStartups: string[];
  ytChannels: { name: string; channelId: string }[];
}

function ch(name: string, channelId: string) {
  return { name, channelId };
}

import { getProfession } from "@/lib/providers/profession-config";

export const PROFESSION_INTELLIGENCE: Record<string, ProfessionIntelligence> = {

  "product-manager": {
    id: "product-manager",
    aiTools: [
      "Notion AI", "Productboard AI", "Jira AI", "Linear AI",
      "Amplitude AI", "Mixpanel AI", "Pendo AI", "ChatGPT", "Claude", "Gemini",
    ],
    aiCompanies: [
      "OpenAI", "Anthropic", "Google DeepMind", "Amplitude", "Mixpanel",
      "Productboard", "Linear", "Notion", "Aha!", "Airfocus",
    ],
    aiWorkflows: [
      "AI product roadmapping", "AI feature prioritization", "AI sprint planning",
      "AI user story generation", "AI product discovery", "AI customer feedback analysis",
      "AI competitive analysis", "AI OKR tracking", "AI PRD writing",
    ],
    aiUseCases: [
      "AI for product managers", "AI product analytics", "AI-powered roadmaps",
      "AI A/B testing analysis", "AI retention analysis", "AI churn prediction",
      "AI product-led growth", "AI for PLG", "AI NPS analysis",
    ],
    aiTopics: [
      "AI product strategy 2025", "agentic products", "LLM-powered features",
      "AI copilots in SaaS", "product discovery AI", "AI metrics",
      "AI product management 2025", "AI in B2B SaaS", "AI product operations",
    ],
    aiStartups: [
      "Atlassian Intelligence", "Airfocus AI", "Cycle AI",
      "Rows AI", "Whimsical AI", "Craft.io AI",
    ],
    ytChannels: [
      ch("Lenny's Podcast",      "UC6t1O76G0jYXOAoYCm153dA"),
      ch("Y Combinator",          "UCcefcZRL2oaA_uBNeo5UOWg"),
      ch("First Round Capital",   "UC_oji6l_-xwhmZqCxRGuAXw"),
      ch("SaaStr AI",             "UCwOILzAcxK5CM2M7oRBuWSg"),
      ch("a16z",                  "UC9cn0TuPq4dnbTY-CBsm8XA"),
      ch("Sequoia Capital",       "UCWrF0oN6unbXrWsTN7RctTw"),
    ],
  },

  "software-engineer": {
    id: "software-engineer",
    aiTools: [
      "Cursor", "GitHub Copilot", "Claude Code", "Windsurf", "Replit",
      "Devin", "Codeium", "Tabnine", "OpenAI API", "Anthropic API",
      "LangChain", "LangGraph", "Vercel AI SDK", "Ollama",
    ],
    aiCompanies: [
      "OpenAI", "Anthropic", "GitHub", "Google DeepMind",
      "Cognition", "Replit", "Vercel", "Hugging Face", "Mistral AI", "Cursor",
    ],
    aiWorkflows: [
      "AI pair programming", "AI code review", "AI debugging",
      "AI test generation", "AI documentation writing", "AI refactoring",
      "agentic coding workflows", "AI CI/CD", "AI-assisted architecture",
    ],
    aiUseCases: [
      "LLM engineering", "RAG systems", "AI agents", "MCP servers",
      "vector databases", "AI-powered APIs", "fine-tuning LLMs",
      "prompt engineering", "multi-agent systems", "AI infrastructure",
    ],
    aiTopics: [
      "AI coding assistants 2025", "vibe coding", "agentic workflows",
      "LLM application development", "AI developer tools", "code generation AI",
      "AI software engineering", "autonomous coding agents", "AI devtools",
    ],
    aiStartups: [
      "Cursor", "Devin by Cognition", "Codeium", "Continue.dev",
      "Sweep AI", "Cosine AI", "Sourcegraph Cody", "Tabnine",
    ],
    ytChannels: [
      ch("Fireship",              "UCsBjURrPoezykLs9EqgamOA"),
      ch("Google for Developers", "UC_x5XG1OV2P6uZZ5FSM9Ttw"),
      ch("Microsoft Developer",   "UCsMica-v34Irf9KVTh6xx-g"),
      ch("OpenAI",                "UCXZCJLdBC09xxGZ6gcdrc6A"),
      ch("AI Engineer",           "UCXZEoeSLyVktPYTtBcmJCpA"),
      ch("Andrej Karpathy",       "UCXUPKJO5MZQRRJN3pYbuUIg"),
      ch("Dave Ebbelaar",         "UCVx6LhKoDoqMktSB1tFYknA"),
      ch("All About AI",          "UCefINOMsEbSPPRFpPj6PPYQ"),
    ],
  },

  "product-designer": {
    id: "product-designer",
    aiTools: [
      "Figma AI", "Adobe Firefly", "Galileo AI", "Uizard", "Relume",
      "v0 by Vercel", "Lovable", "Framer AI", "Midjourney", "DALL-E",
      "Claude", "ChatGPT", "Khroma", "Magician for Figma",
    ],
    aiCompanies: [
      "Figma", "Adobe", "Canva", "Framer", "Vercel",
      "Galileo", "Uizard", "Runway", "Stability AI", "Ideogram",
    ],
    aiWorkflows: [
      "AI wireframing", "AI prototyping", "AI user research analysis",
      "AI design system generation", "AI component generation",
      "AI accessibility audits", "AI copy generation for UI",
      "AI usability testing", "AI design handoff",
    ],
    aiUseCases: [
      "generative UI", "AI-first interfaces", "AI UX research",
      "text-to-UI", "text-to-design", "AI design tokens",
      "AI layout generation", "conversational interfaces design",
      "AI icon generation", "AI brand identity",
    ],
    aiTopics: [
      "AI product design 2025", "AI UX tools", "design AI workflow",
      "Figma AI features", "generative design AI",
      "AI for UX designers", "human-AI interaction design",
      "AI design systems", "AI prototyping tools",
    ],
    aiStartups: [
      "Galileo", "Uizard", "Visily", "Diagram",
      "Magician", "Locofy", "Anima", "Pika Labs", "Runway ML",
    ],
    ytChannels: [
      ch("Figma",             "UCQsVmhSa4X-G3lHlUtejzLA"),
      ch("DesignCode",        "UCTIhfOopxukTIRkbXJ3kN-g"),
      ch("Flux Academy",      "UCN7dywl_bO5GEBTDv3x3WNA"),
      ch("Jesse Showalter",   "UCvBGFeXbBrq3W9_0oNLJREQ"),
      ch("CharliMarieTV",     "UCScRSwdX0t31gjk3MPMdaQA"),
      ch("AJ&Smart",          "UCeB2s4c49GXzwz6GKxlQvLQ"),
      ch("Malewicz",          "UCF_GHbzFoS5j5v_c6G0WKkA"),
    ],
  },

  "doctor": {
    id: "doctor",
    aiTools: [
      "Nuance DAX", "PathAI", "Aidoc", "Viz.ai", "Med-PaLM 2",
      "Epic AI", "Google Health AI", "Suki AI", "Nabla", "DeepMind AlphaFold",
    ],
    aiCompanies: [
      "Nuance", "Google Health", "Microsoft Health", "IBM Watson Health",
      "PathAI", "Aidoc", "Viz.ai", "Tempus", "Flatiron Health",
      "Insilico Medicine", "Recursion Pharmaceuticals",
    ],
    aiWorkflows: [
      "AI clinical documentation", "AI diagnostic imaging", "AI patient triage",
      "AI treatment planning", "AI drug discovery", "AI clinical trial matching",
      "AI radiology reading", "AI surgical assistance", "AI prior authorization",
    ],
    aiUseCases: [
      "AI radiology", "AI pathology", "AI oncology",
      "AI cardiology diagnosis", "AI ophthalmology screening",
      "clinical decision support AI", "AI EHR data extraction",
      "AI patient risk stratification", "precision medicine AI",
    ],
    aiTopics: [
      "healthcare AI 2025", "medical AI breakthroughs", "AI in clinical practice",
      "AI diagnostics", "AI drug discovery 2025", "AI in hospitals",
      "medical imaging AI", "AI patient care", "AI FDA approval",
    ],
    aiStartups: [
      "Hippocratic AI", "Ambience Healthcare", "Abridge AI",
      "Suki AI", "Nabla", "Regard", "Mendel AI", "Deep Genomics",
    ],
    ytChannels: [
      ch("Stanford Medicine",     "UCDrQaGaHpOav5y7m1SCSJRg"),
      ch("Harvard Medical School","UCjG-bUhM813LndEDNOJNCcw"),
      ch("Google DeepMind",       "UCP7jMXSY2xbc3KCAE0MHQ-A"),
      ch("STAT",                  "UC89FjSf9AT1O2qw6vxrrxDQ"),
      ch("MedCram",               "UCG-iSMVtWbbwDDXgXXypARQ"),
      ch("OpenAI",                "UCXZCJLdBC09xxGZ6gcdrc6A"),
      ch("MIT CSAIL",             "UCBpxspUNl1Th33XbugiHJzw"),
    ],
  },

  "teacher": {
    id: "teacher",
    aiTools: [
      "Khanmigo", "MagicSchool AI", "Quizizz AI", "Canva AI for Education",
      "ChatGPT for Education", "Gemini for Education", "Diffit AI",
      "SchoolAI", "Eduaide", "Brisk Teaching",
    ],
    aiCompanies: [
      "Khan Academy", "Google for Education", "Microsoft Education",
      "Quizlet", "Duolingo", "Carnegie Learning", "Age of Learning",
      "Coursera AI", "Synthesis", "MagicSchool",
    ],
    aiWorkflows: [
      "AI lesson planning", "AI assignment generation", "AI grading feedback",
      "AI student progress tracking", "AI differentiated instruction",
      "AI classroom management", "AI quiz generation", "AI rubric creation",
      "AI curriculum design",
    ],
    aiUseCases: [
      "AI personalized learning", "AI tutoring", "adaptive learning AI",
      "AI assessment tools", "AI for special education",
      "AI language learning", "AI STEM education",
      "AI writing feedback", "AI reading comprehension tools",
    ],
    aiTopics: [
      "AI in education 2025", "EdTech AI", "AI classroom tools",
      "AI teacher assistant", "AI for K-12", "AI for higher education",
      "AI student engagement", "learning analytics AI",
      "AI curriculum development",
    ],
    aiStartups: [
      "MagicSchool AI", "Khanmigo", "Synthesis", "SchoolAI",
      "Diffit", "Eduaide", "Brisk Teaching", "Twee AI",
    ],
    ytChannels: [
      ch("Khan Academy",              "UC4a-Gbdw7vOaccHmFo40b9g"),
      ch("MagicSchool AI",            "UCBnFJH2RmhqjFX40BQGVPCA"),
      ch("Matt Miller Ditch Textbook","UCOcMDXuGJYFpH0HNnBaFz1Q"),
      ch("Alice Keeler",              "UCFpxSw5SPlJQobhb3tJn1Vg"),
      ch("Edutopia",                  "UCvq_jXRMdnWVHRUMEP2wNYA"),
      ch("Common Sense Education",    "UCAbLU8xO6lFm2pUEtq_p7ow"),
    ],
  },

  "sales": {
    id: "sales",
    aiTools: [
      "Clay", "Apollo AI", "Gong", "Clari", "HubSpot AI",
      "Salesforce Einstein", "Lavender", "Outreach AI", "Salesloft AI",
      "Chorus.ai", "Orum", "Qualified AI",
    ],
    aiCompanies: [
      "Gong", "Clari", "Salesforce", "HubSpot", "Outreach",
      "Salesloft", "Apollo.io", "Clay", "Lavender", "6sense",
    ],
    aiWorkflows: [
      "AI lead scoring", "AI email personalization", "AI prospecting",
      "AI pipeline forecasting", "AI call coaching", "AI deal intelligence",
      "AI CRM data enrichment", "AI follow-up automation",
      "AI competitive battlecards", "AI sales forecasting",
    ],
    aiUseCases: [
      "AI SDR", "AI BDR outbound", "AI account research",
      "revenue intelligence AI", "AI sales coaching",
      "AI proposal generation", "AI objection handling",
      "AI cold outreach", "AI sales enablement",
    ],
    aiTopics: [
      "AI sales tools 2025", "AI go-to-market strategy", "B2B sales AI",
      "revenue operations AI", "RevOps AI", "AI for enterprise sales",
      "AI account-based marketing", "AI sales agents",
      "AI sales productivity",
    ],
    aiStartups: [
      "Clay", "Lavender", "Orum", "Qualified", "11x AI",
      "Artisan AI", "Regie.ai", "Exceed.ai", "People.ai",
    ],
    ytChannels: [
      ch("Gong",                           "UCYWrNEL35ocP3vDM7B77Spw"),
      ch("HubSpot",                        "UCaAx1xeTgF3rs4rBPDq6-Kw"),
      ch("Salesforce",                     "UCUpquzY878NEaZm5bc7m2sQ"),
      ch("Alex Hormozi",                   "UCUyDOdBWhC1MCxEjC46d-zw"),
      ch("30 Minutes to President's Club", "UCku-dqryeYBuzh_0xVKPExw"),
      ch("My First Million",               "UCyaN6mg5u8Cjy2ZI4ikWaug"),
      ch("SaaStr AI",                      "UCwOILzAcxK5CM2M7oRBuWSg"),
      ch("RevGenius",                      "UC_wDFYj6cQdw1qQ0rIfk-tQ"),
    ],
  },

  "entrepreneur": {
    id: "entrepreneur",
    aiTools: [
      "Lovable", "Bolt.new", "Cursor", "Replit", "v0 by Vercel",
      "Claude", "ChatGPT", "Perplexity", "Midjourney", "Make.com AI",
      "Zapier AI", "n8n AI",
    ],
    aiCompanies: [
      "OpenAI", "Anthropic", "Y Combinator", "a16z",
      "Sequoia Capital", "Founders Fund", "Khosla Ventures",
      "General Catalyst", "Bolt", "Lovable",
    ],
    aiWorkflows: [
      "vibe coding MVP", "AI product prototyping", "AI business plan generation",
      "AI market research", "AI investor pitch prep", "AI financial modeling",
      "AI hiring with AI", "AI customer discovery", "AI go-to-market",
    ],
    aiUseCases: [
      "AI solo founder workflow", "AI no-code startup", "AI bootstrapping",
      "AI startup fundraising", "AI product-market fit",
      "AI content marketing for startups", "AI legal docs for founders",
      "AI for indie hackers",
    ],
    aiTopics: [
      "AI startup 2025", "YC AI startups", "AI funding news",
      "AI product launches", "AI entrepreneurship",
      "building with AI", "AI founder tools", "venture capital AI",
      "AI SaaS business model",
    ],
    aiStartups: [
      "Lovable", "Bolt.new", "Replit", "Perplexity AI", "Runway ML",
      "ElevenLabs", "Luma AI", "Pika Labs", "Kling AI",
    ],
    ytChannels: [
      ch("Y Combinator",        "UCcefcZRL2oaA_uBNeo5UOWg"),
      ch("Greg Isenberg",       "UCPjNBjflYl0-HQtUvOx0Ibw"),
      ch("Lenny's Podcast",     "UC6t1O76G0jYXOAoYCm153dA"),
      ch("My First Million",    "UCyaN6mg5u8Cjy2ZI4ikWaug"),
      ch("Garry Tan",           "UCIBgYfDjtWlbJhg--Z4sOgQ"),
      ch("a16z",                "UC9cn0TuPq4dnbTY-CBsm8XA"),
      ch("Indie Hackers",       "UCJiSw1RWy_IZlZMX09UwjCw"),
      ch("This Week in Startups","UC1UbgWkb41KrhF824U6t6uQ"),
      ch("Sequoia Capital",     "UCWrF0oN6unbXrWsTN7RctTw"),
      ch("First Round Capital", "UC_oji6l_-xwhmZqCxRGuAXw"),
      ch("Founders Podcast",    "UCYOU289oQio3E7jerlJP5Jg"),
      ch("Lex Fridman",         "UCSHZKyawb77ixDdsGog4iWA"),
    ],
  },

  "lawyer": {
    id: "lawyer",
    aiTools: [
      "Harvey AI", "CoCounsel", "Lexis+ AI",
      "Westlaw AI", "Casetext", "Spellbook", "Ironclad AI",
      "Kira Systems", "Luminance", "Robin AI",
    ],
    aiCompanies: [
      "Harvey AI", "Thomson Reuters", "LexisNexis", "Casetext",
      "Ironclad", "Kira Systems", "Luminance", "Robin AI",
      "ContractPodAi", "Litera",
    ],
    aiWorkflows: [
      "AI contract review", "AI legal research", "AI due diligence",
      "AI litigation support", "AI document drafting",
      "AI regulatory compliance", "AI IP research",
      "AI M&A document review", "AI legal brief writing",
    ],
    aiUseCases: [
      "AI contract analysis", "AI case law research", "AI e-discovery",
      "AI compliance monitoring", "AI trademark search",
      "AI patent analysis", "AI risk flagging in contracts",
      "AI legal summarization",
    ],
    aiTopics: [
      "legal AI 2025", "AI law firms", "LegalTech AI",
      "AI regulation compliance", "EU AI Act legal",
      "AI governance law", "AI intellectual property",
      "AI in litigation", "AI ethics law",
    ],
    aiStartups: [
      "Harvey AI", "Robin AI", "Spellbook", "Brightflag",
      "Legora", "Darrow AI", "Clio AI", "Docket AI",
    ],
    ytChannels: [
      ch("Bloomberg Law",       "UCJL_gIOVp2fjfsKH4kbeEwA"),
      ch("Legal Talk Network",  "UCASCCyql5OF5wpGoPDyNOQA"),
      ch("Harvard Law School",  "UCBcn1VNOJUsPNrsCJGTcquw"),
      ch("Stanford Law School", "UCK8Ar8dzFbKIJiALebDysUQ"),
      ch("Lex Fridman",         "UCSHZKyawb77ixDdsGog4iWA"),
      ch("Thomson Reuters",     "UCwIde9oejR6WpaVEa5zZ37w"),
      ch("Ironclad",            "UCzJLsKpOW00mUzGO2_k7xiQ"),
      ch("LegalZoom",           "UCiGZICh-foVlKTCT6myF7kA"),
    ],
  },

  "content-designer": {
    id: "content-designer",
    aiTools: [
      "ChatGPT", "Claude", "Jasper AI", "Writer AI", "Copy.ai",
      "Grammarly AI", "Wordtune", "Notion AI", "Lex", "Anyword",
      "Writesonic", "Surfer SEO", "Hemingway Editor",
    ],
    aiCompanies: [
      "OpenAI", "Anthropic", "Jasper", "Writer", "Grammarly",
      "Wordtune", "Copy.ai", "Notion", "Anyword", "Writesonic",
    ],
    aiWorkflows: [
      "AI blog writing", "AI email copywriting", "AI UX microcopy",
      "AI technical documentation", "AI content editing", "AI headline generation",
      "AI voice and tone guidelines", "AI style guide creation",
      "AI content audit", "AI localization copy", "AI SEO content writing",
      "AI newsletter drafting", "AI help center articles",
    ],
    aiUseCases: [
      "AI for content writers", "AI UX writing tools", "AI copywriting assistants",
      "AI technical writing", "AI product copy", "AI marketing content",
      "AI newsletter writing", "AI plain language writing",
      "AI error message writing", "AI onboarding copy", "AI content operations",
    ],
    aiTopics: [
      "AI content writing 2025", "AI copywriting tools", "AI UX writing",
      "AI technical documentation", "AI content strategy", "AI editorial workflow",
      "AI microcopy", "AI content operations", "AI writing assistants",
    ],
    aiStartups: [
      "Jasper AI", "Writer AI", "Lex", "Wordtune", "Anyword",
      "Writesonic", "Copy.ai", "Grammarly",
    ],
    ytChannels: [
      ch("NN/g",                  "UC2oCugzU6W8-h95W7eBTUEg"),
      ch("UX Content Collective", "UCZoF29d32itjXWZvzsM5y0A"),
      ch("Grammarly",             "UCfmqLyr1PI3_zbwppHNEzuQ"),
      ch("Jasper",                "UCJKYBgFQoE9appKOs5HAIyQ"),
      ch("Copyblogger",           "UCK1xA5o_4Cliy4Q4ltTq8dw"),
      ch("Ann Handley",           "UCKOnl6ZCJB_gfjgEVxHt9MQ"),
      ch("Ahrefs",                "UCWquNQV8Y0_defMKnGKrFOQ"),
      ch("WordTune",              "UCMgBA0tnhCty_v_CsRfPfbw"),
    ],
  },
};

// ── Query generator ───────────────────────────────────────────────────────────

/**
 * Generates targeted YouTube search queries at Profession × AI intersection.
 * Every query names the profession context — no bare "OpenAI 2025" searches.
 */
export function buildVideoQueries(professionId: string): string[] {
  const intel = PROFESSION_INTELLIGENCE[professionId];
  const prof = getProfession(professionId);
  const year = new Date().getFullYear();
  const label = prof?.label ?? professionId.replace(/-/g, " ");

  if (!intel) {
    return [
      `AI for ${label} ${year}`,
      `AI tools ${label} professional`,
      `how AI is changing ${label.toLowerCase()}`,
    ];
  }

  const queries: string[] = [
    `AI for ${label.toLowerCase()} ${year}`,
    `${label} AI tools ${year}`,
    `how AI is changing ${label.toLowerCase()}`,
    `AI news ${label.toLowerCase()} ${year}`,
  ];

  intel.aiUseCases.slice(0, 6).forEach((uc) => queries.push(uc));
  intel.aiWorkflows.slice(0, 5).forEach((wf) => queries.push(`${wf} ${year}`));
  intel.aiTopics.slice(0, 5).forEach((t) => queries.push(t));

  intel.aiTools.slice(0, 5).forEach((tool) => {
    queries.push(`${tool} for ${label.toLowerCase()}`);
    queries.push(`AI ${tool} ${label.toLowerCase()}`);
  });

  intel.aiStartups.slice(0, 2).forEach((s) => {
    queries.push(`${s} ${label.toLowerCase()} demo`);
  });

  const shortsBase = [
    ...intel.aiUseCases.slice(0, 2),
    `AI ${label.toLowerCase()}`,
  ];
  shortsBase.forEach((q) => queries.push(`${q} shorts`));

  return [...new Set(queries)].slice(0, 28);
}

/**
 * Returns curated YouTube channels for the profession.
 * Falls back to general high-quality AI channels.
 */
export function getProfessionChannels(
  professionId: string,
): { name: string; channelId: string }[] {
  return PROFESSION_INTELLIGENCE[professionId]?.ytChannels ?? [];
}

/**
 * AI signal terms for scoring video relevance.
 * Includes tools, companies, topics + universal AI terms.
 */
export function getAISignalTerms(professionId: string): string[] {
  const intel = PROFESSION_INTELLIGENCE[professionId];
  if (!intel) return ["ai", "artificial intelligence", "machine learning", "llm", "gpt"];

  return [
    ...intel.aiTools.map((t) => t.toLowerCase()),
    ...intel.aiCompanies.map((c) => c.toLowerCase()),
    ...intel.aiTopics.map((t) => t.toLowerCase()),
    // Universal AI signals always contribute
    "ai", "artificial intelligence", "machine learning", "llm", "gpt",
    "chatgpt", "claude", "gemini", "openai", "anthropic",
  ];
}
