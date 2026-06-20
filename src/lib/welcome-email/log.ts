/** Structured welcome-email logs — visible in Vercel Runtime Logs. */
export function logWelcomeEmail(
  stage: string,
  data: Record<string, unknown>,
): void {
  console.info(`[welcome-email-flow] ${stage}`, data);
}
