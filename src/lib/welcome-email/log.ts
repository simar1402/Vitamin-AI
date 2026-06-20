/**
 * Temporary production diagnostics for welcome email.
 * Filter Vercel Runtime Logs: [WELCOME_EMAIL_PROD]
 */
export function logWelcomeEmailProd(
  stage: string,
  data: Record<string, unknown>,
): void {
  console.info(`[WELCOME_EMAIL_PROD] ${stage}`, {
    ...data,
    ts: new Date().toISOString(),
  });
}

/** Alias used across welcome-email modules */
export function logWelcomeEmail(
  stage: string,
  data: Record<string, unknown>,
): void {
  logWelcomeEmailProd(stage, data);
}
