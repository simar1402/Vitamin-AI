export const PROFESSIONS = [
  "Product Designer",
  "Developer",
  "Founder",
  "Marketer",
  "Student",
  "Doctor",
  "Fashion Designer",
  "Researcher",
] as const;

export const INTEREST_CATEGORIES = [
  {
    label: "Creative & Design",
    emoji: "🎨",
    items: ["AI design", "Generative AI", "Fashion AI", "Architecture AI", "Visual storytelling", "AI photography"],
  },
  {
    label: "Technology",
    emoji: "💻",
    items: ["AI coding", "Agents", "AI tools", "Open source AI", "Edge AI", "AI infrastructure"],
  },
  {
    label: "Business & Growth",
    emoji: "🚀",
    items: ["AI startups", "Automation", "Productivity", "AI marketing", "AI finance", "Sales AI"],
  },
  {
    label: "Science & Health",
    emoji: "🧬",
    items: ["Healthcare AI", "Medical imaging", "Drug discovery", "Mental health AI", "Biotech AI", "Clinical AI"],
  },
  {
    label: "Industry & Future of Work",
    emoji: "🏭",
    items: ["Robotics", "Manufacturing AI", "Supply chain AI", "Legal AI", "HR & recruiting AI", "Education AI"],
  },
  {
    label: "Society & Culture",
    emoji: "🌍",
    items: ["AI policy", "AI ethics", "AI & climate", "AI & music", "AI & sports", "AI & journalism"],
  },
] as const;

export const INTERESTS = INTEREST_CATEGORIES.flatMap((c) => c.items) as unknown as readonly string[];

export const CONTENT_PREFERENCES = [
  "Short summaries",
  "Videos",
  "Discussions",
  "Tools",
  "Product launches",
  "News",
] as const;

export const CATEGORIES = [
  "All",
  "News",
  "Tools",
  "Launches",
  "Videos",
  "Discussions",
  "Workflows",
  "Startups",
  "Research",
] as const;

export const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/trending", label: "Trending", icon: "trending" },
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/saved", label: "Saved", icon: "saved" },
  { href: "/profile", label: "Profile", icon: "profile" },
] as const;

export const STORAGE_KEYS = {
  userProfile: "vitamin-ai-profile",
  onboardingComplete: "vitamin-ai-onboarding",
  savedPosts: "vitamin-ai-saved",
} as const;
