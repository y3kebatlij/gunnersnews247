import type { ContentItemInput, ContentType } from "@arsenal/shared";

/**
 * Fetch a web page and extract basic metadata.
 * This is a lightweight scraper for pages that don't have RSS feeds.
 * It extracts title, description, and word count from HTML meta tags and body.
 */
export async function scrapeWebPage(
  url: string,
  sourceName: string,
  sourceCountry: string,
  contentType: ContentType
): Promise<ContentItemInput | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ArsenalNewsAggregator/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    const title = extractMetaContent(html, "og:title")
      ?? extractTagContent(html, "title")
      ?? "";

    const description = extractMetaContent(html, "og:description")
      ?? extractMetaContent(html, "description")
      ?? "";

    if (!title.trim()) return null;

    // Check Arsenal relevance
    const combined = `${title} ${description}`.toLowerCase();
    const arsenalKeywords = ["arsenal", "gunners", "emirates stadium", "arteta", "afc"];
    if (!arsenalKeywords.some((kw) => combined.includes(kw))) return null;

    const wordCount = estimateBodyWordCount(html);

    return {
      sourceUrl: url,
      title: title.trim(),
      summary: description.trim(),
      publicationDate: extractPublishDate(html) ?? new Date().toISOString(),
      sourceName,
      sourceCountry,
      contentType,
      estimatedDurationMinutes: null,
      rawWordCount: wordCount > 0 ? wordCount : undefined,
    };
  } catch {
    return null;
  }
}

/** Extract content from a meta tag by property or name */
function extractMetaContent(html: string, name: string): string | null {
  // Try property attribute first (Open Graph)
  const propRegex = new RegExp(
    `<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const propMatch = html.match(propRegex);
  if (propMatch?.[1]) return propMatch[1];

  // Try name attribute
  const nameRegex = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const nameMatch = html.match(nameRegex);
  if (nameMatch?.[1]) return nameMatch[1];

  // Try reversed attribute order (content before property)
  const revRegex = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
    "i"
  );
  const revMatch = html.match(revRegex);
  return revMatch?.[1] ?? null;
}

/** Extract content from an HTML tag */
function extractTagContent(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = html.match(regex);
  return match?.[1]?.trim() ?? null;
}

/** Try to extract publish date from meta tags */
function extractPublishDate(html: string): string | null {
  const dateStr = extractMetaContent(html, "article:published_time")
    ?? extractMetaContent(html, "datePublished")
    ?? extractMetaContent(html, "date");

  if (dateStr) {
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

/** Estimate word count from HTML body by stripping tags */
function estimateBodyWordCount(html: string): number {
  // Try to extract just the article body
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyContent = articleMatch?.[1] ?? html;

  const stripped = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length === 0) return 0;
  return stripped.split(" ").length;
}
