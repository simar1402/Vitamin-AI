/**
 * Shared types for the provider architecture.
 * Every provider (YouTube, Google News, Medium) normalises its results
 * into FeedItem before returning. The feed API then ranks, filters,
 * deduplicates and serves them as FeedStory objects to the UI.
 */

export type ContentType = "Videos" | "News" | "Articles";

export type Industry =
  | "Design"
  | "Engineering"
  | "Medical"
  | "Marketing"
  | "Product Management"
  | "Finance"
  | "Education"
  | "Legal"
  | "Fashion"
  | "Research"
  | "Entrepreneurship"
  // Legacy field IDs used by the onboarding flow
  | "Business"
  | "Insurance"
  | "Healthcare"
  | "Technology"
  | "Arts"
  | "Law"
  | "Science"
  | "Generative AI";

/** Normalised feed item — common shape for every provider */
export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  thumbnail: string | null;
  source: string;
  publishedAt: string; // ISO-8601
  contentType: ContentType;
  industry: string;
  /** 0–1 relevance score assigned by the ranker */
  score?: number;
}

/** What every provider must implement */
export interface FeedProvider {
  name: string;
  fetch(industry: string, contentType: ContentType, limit: number): Promise<FeedItem[]>;
}

/** Queries keyed by industry, one per provider */
export type QueryMap = Record<string, string[]>;
