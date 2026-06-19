/** Decode common HTML entities in RSS titles and summaries */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCharCode(n) : _;
    })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function stripHtml(s: string): string {
  return decodeHtmlEntities(
    s
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** True when a URL is a Google wrapper/search page, not a direct article. */
export function isWrapperOrSearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "news.google.com" || host.endsWith(".news.google.com")) return true;
    if ((host === "google.com" || host.endsWith(".google.com")) && parsed.pathname.startsWith("/search")) {
      return true;
    }
    if ((host === "google.com" || host.endsWith(".google.com")) && parsed.pathname.startsWith("/url")) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Produce a one-line snippet for cards — never raw HTML or duplicate titles.
 */
export function formatStorySummary(title: string, raw: string, sourceName?: string): string {
  const text = stripHtml(raw)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const titleNorm = norm(title);
  const textNorm = norm(text);

  if (!text || textNorm === titleNorm || textNorm.startsWith(titleNorm)) {
    return sourceName ? `From ${sourceName}` : "";
  }

  const sentence = text.match(/^.{20,}?[.!?](?:\s|$)/)?.[0]?.trim() ?? text;
  return sentence.length > 220 ? `${sentence.slice(0, 217).trim()}…` : sentence;
}
