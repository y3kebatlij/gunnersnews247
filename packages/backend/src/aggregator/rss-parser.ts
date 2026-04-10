import { XMLParser } from "fast-xml-parser";
import type { ContentItemInput, ContentType } from "@arsenal/shared";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  "content:encoded"?: string;
  enclosure?: {
    "@_url"?: string;
    "@_type"?: string;
    "@_length"?: string;
  };
  "itunes:duration"?: string | number;
  "itunes:summary"?: string;
}

interface RSSChannel {
  title?: string;
  item?: RSSItem | RSSItem[];
}

interface RSSFeed {
  rss?: { channel?: RSSChannel };
  feed?: { entry?: RSSItem | RSSItem[] }; // Atom format
}

/** Parse duration string like "01:23:45" or "3600" into seconds */
function parseDuration(raw: string | number | undefined): number | undefined {
  if (raw == null) return undefined;
  const str = String(raw).trim();

  // Pure number = seconds
  if (/^\d+$/.test(str)) return parseInt(str, 10);

  // HH:MM:SS or MM:SS
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];

  return undefined;
}

/** Estimate word count from HTML/text content */
function estimateWordCount(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length === 0) return 0;
  return stripped.split(" ").length;
}

/** Determine if an RSS item is a podcast episode */
function isPodcast(item: RSSItem): boolean {
  if (item.enclosure?.["@_type"]?.startsWith("audio/")) return true;
  if (item["itunes:duration"] != null) return true;
  return false;
}

/** Fetch and parse an RSS/Atom feed, returning content items */
export async function parseRSSFeed(
  url: string,
  sourceName: string,
  sourceCountry: string,
  contentType: ContentType
): Promise<ContentItemInput[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "ArsenalNewsAggregator/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as RSSFeed;

  // Handle RSS 2.0
  const channel = parsed.rss?.channel;
  let rawItems: RSSItem[] = [];

  if (channel?.item) {
    rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];
  } else if (parsed.feed?.entry) {
    // Atom format
    const entries = parsed.feed.entry;
    rawItems = Array.isArray(entries) ? entries : [entries];
  }

  const items: ContentItemInput[] = [];

  for (const raw of rawItems) {
    const title = String(raw.title ?? "").trim();
    if (!title) continue;

    // Filter for Arsenal-related content
    const fullText = `${title} ${raw.description ?? ""} ${raw["content:encoded"] ?? ""}`;
    if (!isArsenalRelated(fullText)) continue;

    const bodyText = raw["content:encoded"] ?? raw.description ?? "";
    const wordCount = estimateWordCount(bodyText);

    // Determine actual content type
    let actualType = contentType;
    if (isPodcast(raw)) actualType = "podcast";

    const durationSeconds = parseDuration(raw["itunes:duration"]);

    items.push({
      sourceUrl: String(raw.link ?? url),
      title,
      summary: bodyText,
      publicationDate: raw.pubDate ? new Date(raw.pubDate).toISOString() : new Date().toISOString(),
      sourceName,
      sourceCountry,
      contentType: actualType,
      estimatedDurationMinutes: null, // Computed later by duration.ts
      rawWordCount: wordCount > 0 ? wordCount : undefined,
      rawDurationSeconds: durationSeconds,
    });
  }

  return items;
}

/** Check if content is Arsenal-related using keyword matching */
function isArsenalRelated(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    "arsenal",
    "gunners",
    "emirates stadium",
    "arteta",
    "the arsenal",
    "afc",
  ];
  return keywords.some((kw) => lower.includes(kw));
}
