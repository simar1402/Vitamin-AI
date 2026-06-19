const BRAND_BG = "#faf8f5";
const BRAND_TEXT = "#1c1c1c";
const BRAND_MUTED = "#6b6560";
const BRAND_ACCENT = "#2a2a2a";
const BRAND_BORDER = "#e8e4df";

export const WELCOME_EMAIL_SUBJECT = "🌟 Welcome to Vitamin-AI";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWelcomeEmailHtml(firstName: string): string {
  const name = escapeHtml(firstName);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${WELCOME_EMAIL_SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;background:${BRAND_ACCENT};">
                <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.72);">Vitamin-AI</p>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#ffffff;">Welcome aboard 🌟</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND_TEXT};">Good morning, ${name} 👋</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">Welcome to Vitamin-AI.</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">I'm Simar, and I created Vitamin-AI because keeping up with AI has become almost impossible.</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">Think of this as your daily dose of AI nutrition — curated specifically for your profession.</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">Every morning, you'll receive a short digest with the most relevant AI updates, tools, articles, and videos, so you stay ahead without spending hours searching.</p>
                <ul style="margin:0 0 24px;padding-left:0;list-style:none;">
                  <li style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT};">☀️ No information overload.</li>
                  <li style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT};">⚡ Only the most relevant updates.</li>
                  <li style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT};">🎯 Tailored to your profession.</li>
                </ul>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND_MUTED};">Your first daily dose will arrive tomorrow morning.</p>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT};">Happy consuming!</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND_MUTED};">— Simar<br />Founder, Vitamin-AI</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildWelcomeEmailText(firstName: string): string {
  return `Good morning, ${firstName} 👋

Welcome to Vitamin-AI.

I'm Simar, and I created Vitamin-AI because keeping up with AI has become almost impossible.

Think of this as your daily dose of AI nutrition — curated specifically for your profession.

Every morning, you'll receive a short digest with the most relevant AI updates, tools, articles, and videos, so you stay ahead without spending hours searching.

☀️ No information overload.
⚡ Only the most relevant updates.
🎯 Tailored to your profession.

Your first daily dose will arrive tomorrow morning.

Happy consuming!

— Simar
Founder, Vitamin-AI`;
}
