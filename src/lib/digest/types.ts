export interface DigestStory {
  headline: string;
  summary: string;
  sourceUrl: string;
}

export interface DigestContent {
  article: DigestStory | null;
  video: DigestStory | null;
}

export interface DigestRecipient {
  userId: string;
  email: string;
  firstName: string;
  professionId: string;
  professionLabel: string;
}

export interface DigestSendResult {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DailyDigestRunResult {
  mode: "production" | "test";
  startedAt: string;
  finishedAt: string;
  /** Total eligible users loaded from Supabase profiles. */
  usersFound: number;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  results: DigestSendResult[];
  errors: string[];
}
