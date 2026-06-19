import type { DigestContent } from "./types";

const BRAND_BG = "#faf8f5";
const BRAND_TEXT = "#1c1c1c";
const BRAND_MUTED = "#6b6560";
const BRAND_ACCENT = "#2a2a2a";
const BRAND_BORDER = "#e8e4df";

export const DIGEST_SUBJECT = "Your Vitamin-AI Daily Digest ☀️";

export interface DigestEmailParams {
  firstName: string;
  professionLabel: string;
  content: DigestContent;
}

function renderStoryBlock(
  label: string,
  story: { headline: string; summary: string; sourceUrl: string } | null,
  ctaLabel: string,
): string {
  if (!story) {
    return `
      <tr>
        <td style="padding:0 0 28px 0;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_MUTED};">${label}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND_MUTED};">No pick available today — check back tomorrow.</p>
        </td>
      </tr>`;
  }

  return `
    <tr>
      <td style="padding:0 0 28px 0;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_MUTED};">${label}</p>
        <div style="background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:12px;padding:20px;">
          <h2 style="margin:0 0 10px;font-size:18px;line-height:1.35;font-weight:600;color:${BRAND_TEXT};">${escapeHtml(story.headline)}</h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:${BRAND_MUTED};">${escapeHtml(story.summary)}</p>
          <a href="${escapeHtml(story.sourceUrl)}" style="display:inline-block;font-size:14px;font-weight:600;color:${BRAND_ACCENT};text-decoration:none;">${ctaLabel} →</a>
        </div>
      </td>
    </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDigestHtml(params: DigestEmailParams): string {
  const { firstName, professionLabel, content } = params;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${DIGEST_SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;background:${BRAND_ACCENT};">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.72);">Vitamin-AI</p>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;font-weight:600;color:#ffffff;">Your Daily Digest ☀️</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${BRAND_TEXT};">Good Morning, ${escapeHtml(firstName)} ☀️</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">Here is your dose of Vitamin-AI for the day.</p>
                <p style="margin:0 0 28px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_MUTED};">Profession: <span style="color:${BRAND_TEXT};">${escapeHtml(professionLabel)}</span></p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${renderStoryBlock("Article of the Day", content.article, "Read Article")}
                  ${renderStoryBlock("Video of the Day", content.video, "Watch Video")}
                </table>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT};">Have a productive day.</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND_MUTED};">— Vitamin-AI</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildDigestText(params: DigestEmailParams): string {
  const { firstName, professionLabel, content } = params;

  const articleBlock = content.article
    ? `ARTICLE OF THE DAY
${content.article.headline}
${content.article.summary}
Read Article → ${content.article.sourceUrl}`
    : `ARTICLE OF THE DAY
No pick available today.`;

  const videoBlock = content.video
    ? `VIDEO OF THE DAY
${content.video.headline}
${content.video.summary}
Watch Video → ${content.video.sourceUrl}`
    : `VIDEO OF THE DAY
No pick available today.`;

  return `Good Morning, ${firstName} ☀️

Here is your dose of Vitamin-AI for the day.

Profession:
${professionLabel}

${articleBlock}

${videoBlock}

Have a productive day.

— Vitamin-AI`;
}
