export type FeedCategory =
  | "news"
  | "tools"
  | "launches"
  | "videos"
  | "discussions"
  | "workflows"
  | "startups"
  | "research";

export type ContentType =
  | "summary"
  | "video"
  | "discussion"
  | "tool"
  | "launch"
  | "news";

/** Where the item appears on the home feed. */
export type FeedSection = "video_short" | "short_read" | "instagram";

export interface FeedItem {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  category: FeedCategory;
  contentType: ContentType;
  section: FeedSection;
  source: string;
  /** Always set for navigation — opens in new tab */
  sourceUrl: string;
  imageUrl: string;
  publishedAt: string;
  trending?: boolean;
  tags: string[];
  /** Instagram-style inspiration */
  creatorName?: string;
  creatorHandle?: string;
  creatorAvatarUrl?: string;
}

export interface UserProfile {
  interests: string[];
  onboardingComplete: boolean;
}
