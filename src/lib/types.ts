export interface Story {
  id: string;
  headline: string;
  summary: string;
  why_it_matters: string | null;
  category: string;
  content_type: string;
  source_url: string;
  source_name: string | null;
  image_url: string | null;
  tags: string[];
  published_at: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  profession: string | null;
  interests: string[];
  content_types: string[];
  onboarded: boolean;
}

export const PROFESSIONS = [
  "Designer", "Developer", "Founder", "Marketer",
  "Student", "Researcher", "Product Manager", "Writer",
  "Educator", "Consultant", "Analyst", "Other",
];

// Long topic list — user picks areas of interest to curate the feed.
export const INTERESTS = [
  "Design", "Product Design", "UX Research", "Fashion Design", "Architecture", "Interior Design",
  "Engineering", "Software Engineering", "Hardware", "Robotics", "Aerospace", "Automotive",
  "Medical", "Healthcare", "Biotech", "Pharma", "Mental Health", "Genomics",
  "Marketing", "Growth", "Advertising", "Branding", "SEO", "Social Media",
  "Finance", "Fintech", "Investing", "Crypto", "Banking", "Insurance",
  "Law", "Policy", "AI Regulation", "Ethics", "Privacy", "Security",
  "Education", "EdTech", "Academia", "Teaching", "Online Learning",
  "Science", "Physics", "Chemistry", "Biology", "Climate", "Energy",
  "Art", "Photography", "Film", "Music", "Writing", "Publishing",
  "Gaming", "VR/AR", "3D", "Animation", "Esports",
  "Productivity", "Automation", "Agents", "No-code", "DevTools",
  "Startups", "Venture Capital", "Sales", "HR", "Operations",
  "Retail", "E-commerce", "Logistics", "Manufacturing", "Real Estate",
  "Sports", "Fitness", "Wellness", "Food", "Travel",
  "News", "Generative AI", "LLMs", "Computer Vision", "Voice AI",
];

export const CONTENT_TYPES = [
  "News", "Videos", "Articles",
];

export const CATEGORIES = [
  "All", "News", "Tools", "Launches", "Research", "Workflows", "Discussions",
];
