const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data as T;
  } catch { return null; }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

export interface ContentItem {
  contentId: string;
  title: string;
  summary: string;
  durationLabel: string;
  sourceUrl: string;
  sourceName: string;
  sourceCountry: string;
  contentType: string;
  publicationDate?: string;
}

export interface TransferItem {
  contentId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  sourceCountry: string;
  transferType: string;
  publicationDate: string;
  durationLabel: string;
}

const PROXY = "https://arsenal-proxy.eyuelkt.workers.dev/rss?url=";
const WOMEN_KEYWORDS = ["wsl", "women", "russo", "uwcl", "women's super league", "women's champions league"];

const RSS_SOURCES = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", name: "BBC Sport", country: "England", type: "news" },
  { url: "https://www.skysports.com/rss/12040", name: "Sky Sports", country: "England", type: "news" },
  { url: "https://www.theguardian.com/football/arsenal/rss", name: "The Guardian", country: "England", type: "news" },
  { url: "https://www.espn.com/espn/rss/soccer/news", name: "ESPN FC", country: "USA", type: "news" },
  { url: "https://www.goal.com/feeds/en/news", name: "Goal.com", country: "Global", type: "news" },
  { url: "https://www.fourfourtwo.com/rss", name: "FourFourTwo", country: "England", type: "news" },
  { url: "https://www.90min.com/feeds/latest", name: "90min", country: "Global", type: "news" },
  { url: "https://www.supersport.com/rss/football", name: "SuperSport", country: "Africa", type: "news" },
  { url: "https://sportstar.thehindu.com/football/feed", name: "Sportstar India", country: "Asia", type: "news" },
  { url: "https://en.africatopsports.com/feed", name: "Africa Top Sports", country: "Africa", type: "news" },
  { url: "https://www.futaa.com/rss/football", name: "Futaa", country: "Africa", type: "news" },
  { url: "https://www.marca.com/en/football/arsenal/rss.html", name: "Marca", country: "Spain", type: "news" },
  { url: "https://www.goal.com/pt-br/feeds/news", name: "Goal Brasil", country: "Brazil", type: "news" },
  { url: "https://www.tycsports.com/rss", name: "TyC Sports", country: "Argentina", type: "news" },
  { url: "https://dailycannon.com/feed", name: "Daily Cannon", country: "England", type: "news" },
  { url: "https://arsenal-mania.com/feed", name: "Arsenal Mania", country: "England", type: "news" },
  { url: "https://arseblog.com/feed/", name: "Arseblog", country: "England", type: "blog" },
  { url: "https://www.justarsenal.com/feed", name: "Just Arsenal", country: "England", type: "blog" },
  { url: "https://paininthearsenal.com/feed", name: "Pain in the Arsenal", country: "England", type: "blog" },
  { url: "https://le-grove.co.uk/feed", name: "Le Grove", country: "England", type: "blog" },
  { url: "https://goonerdaily.com/feed", name: "Gooner Daily", country: "England", type: "blog" },
  { url: "https://arseblog.com/category/arsecast/feed/", name: "Arsecast", country: "England", type: "podcast" },
  { url: "https://feeds.acast.com/public/shows/681887451d28d623139a0fc9", name: "Handbrake Off", country: "England", type: "podcast" },
  { url: "https://feeds.simplecast.com/sjbSL_pM", name: "ArsenalVision", country: "USA", type: "podcast" },
  { url: "https://feeds.acast.com/public/shows/6240943ecb6c90001298fb89", name: "Gooner Talk", country: "England", type: "podcast" },
  { url: "https://feeds.acast.com/public/shows/inside-arsenal-with-charles-watts", name: "Inside Arsenal", country: "England", type: "podcast" },
  { url: "https://feeds.acast.com/public/shows/the-grove-an-arsenal-podcast", name: "The Grove", country: "England", type: "podcast" },
  { url: "https://arseblog.com/category/arsenal-women-arsecast/feed/", name: "Arsenal Women Arsecast", country: "England", type: "podcast" },
  { url: "https://www.theguardian.com/football/arsenal-women/rss", name: "Guardian Women", country: "England", type: "women" },
  { url: "https://www.skysports.com/rss/12040", name: "Sky Sports Women", country: "England", type: "women" },
  { url: "https://arseblog.com/category/arsenal-women/feed/", name: "Arseblog Women", country: "England", type: "women" },
  { url: "https://www.justarsenal.com/category/arsenal-women/feed", name: "Just Arsenal Women", country: "England", type: "women" },
  { url: "https://feeds.bbci.co.uk/sport/women-s-football/rss.xml", name: "BBC Women's Football", country: "England", type: "women" },
  { url: "https://arseblog.news/category/arsenal-women/feed", name: "Arseblog Women News", country: "England", type: "women" },
  { url: "https://dailycannon.com/tag/arsenal-women/feed", name: "Daily Cannon Women", country: "England", type: "women" },
  { url: "https://shekicks.net/feed", name: "She Kicks", country: "England", type: "women" },
];

const TRANSFER_SOURCES = [
  { url: "https://www.skysports.com/rss/12040", name: "Sky Sports", country: "England" },
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", name: "BBC Sport", country: "England" },
  { url: "https://www.theguardian.com/football/transfers/rss", name: "The Guardian", country: "England" },
  { url: "https://arseblog.com/feed/", name: "Arseblog", country: "England" },
  { url: "https://paininthearsenal.com/feed", name: "Pain in the Arsenal", country: "England" },
  { url: "https://www.justarsenal.com/feed", name: "Just Arsenal", country: "England" },
  { url: "https://www.goal.com/feeds/en/news", name: "Goal.com", country: "Global" },
];

const TRANSFER_KEYWORDS = [
  "transfer", "sign", "signing", "deal", "loan", "depart", "exit", "bid",
  "fee", "contract", "extension", "rumour", "rumor", "target", "move",
  "linked", "interest", "window", "summer", "january",
];

const ARSENAL_VIDEOS: ContentItem[] = [
  { contentId: "video-official-channel", title: "Arsenal FC - Official YouTube Channel", summary: "Watch the latest Arsenal FC match highlights, behind the scenes content, player interviews, training sessions and more on the official Arsenal YouTube channel.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/@Arsenal", sourceName: "Arsenal FC Official", sourceCountry: "England", contentType: "video", publicationDate: new Date().toISOString() },
  { contentId: "video-ucl-highlights", title: "Arsenal vs PSG - Champions League Final Preview", summary: "Arsenal face PSG in the UEFA Champions League Final. Watch all the build-up, analysis and highlights from their semi-final victory.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/results?search_query=Arsenal+PSG+Champions+League+2026", sourceName: "Arsenal FC Official", sourceCountry: "England", contentType: "video", publicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { contentId: "video-atletico-highlights", title: "Arsenal vs Atletico Madrid - Champions League Semi Final", summary: "Watch the highlights from Arsenal's UEFA Champions League semi-final clash against Atletico Madrid at the Emirates Stadium.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/results?search_query=Arsenal+Atletico+Madrid+Champions+League+semi+final+2026", sourceName: "Arsenal FC Official", sourceCountry: "England", contentType: "video", publicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { contentId: "video-aftv", title: "AFTV - Arsenal Fan TV Reactions & Analysis", summary: "The largest Arsenal fan channel. Passionate fan reactions, match previews, post-match interviews and all things Arsenal.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/@AFTVMedia", sourceName: "AFTV", sourceCountry: "England", contentType: "video", publicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { contentId: "video-gyokeres", title: "Viktor Gyokeres - All Goals & Assists for Arsenal", summary: "Watch every goal and assist from Viktor Gyokeres since joining Arsenal. The Swedish striker has been in sensational form.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/results?search_query=Viktor+Gyokeres+Arsenal+goals+2026", sourceName: "Arsenal FC Official", sourceCountry: "England", contentType: "video", publicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { contentId: "video-latest", title: "Arsenal Latest Highlights & Goals 2026", summary: "Find all the latest Arsenal match highlights, goals, saves and more on YouTube. Updated after every Arsenal match.", durationLabel: "Video", sourceUrl: "https://www.youtube.com/results?search_query=Arsenal+highlights+2026", sourceName: "YouTube", sourceCountry: "England", contentType: "video", publicationDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
];

// ── DEDUPLICATION ────────────────────────────────────────────
function titleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");
}

function deduplicateByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fp = titleFingerprint(item.title);
    if (!fp || seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
}
// ────────────────────────────────────────────────────────────

function parseRSSDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  try { return new Date(dateStr).toISOString(); } catch { return undefined; }
}

function estimateDuration(text: string): string {
  const mins = Math.max(1, Math.round(text.split(/\s+/).length / 200));
  return `${mins} min read`;
}

function guessTransferType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("loan")) return "loan";
  if (t.includes("depart") || t.includes("exit") || t.includes("leav") || t.includes("sold") || t.includes("release")) return "departure";
  if (t.includes("extension") || t.includes("renew")) return "contract_extension";
  if (t.includes("sign") || t.includes("complet") || t.includes("confirmed") || t.includes("official") || t.includes("done deal")) return "confirmed_signing";
  return "rumor";
}

async function fetchRSSItems(source: { url: string; name: string; country: string; type?: string }): Promise<any[]> {
  const res = await fetch(`${PROXY}${encodeURIComponent(source.url)}`);
  if (!res.ok) return [];
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const items = Array.from(xml.querySelectorAll("item, entry"));
  return items.map((item, i) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const link = item.querySelector("link")?.getAttribute("href") || item.querySelector("link")?.textContent?.trim() || "";
    const description = item.querySelector("description")?.textContent?.replace(/<[^>]+>/g, "").trim() || item.querySelector("summary")?.textContent?.replace(/<[^>]+>/g, "").trim() || "";
    const pubDate = item.querySelector("pubDate")?.textContent || item.querySelector("published")?.textContent || item.querySelector("updated")?.textContent || null;
    return { i, title, link, description, pubDate, source };
  });
}

export async function fetchArsenalNews(contentType?: string): Promise<ContentItem[]> {
  const cacheKey = `arsenal-news-${contentType ?? "all"}`;
  const cached = getCached<ContentItem[]>(cacheKey);
  if (cached) return cached;

  if (contentType === "video") {
    setCache(cacheKey, ARSENAL_VIDEOS);
    return ARSENAL_VIDEOS;
  }

  const sources = contentType === "women"
    ? RSS_SOURCES.filter(s => s.type === "women" || s.type === "news")
    : contentType
    ? RSS_SOURCES.filter(s => s.type === contentType)
    : RSS_SOURCES;
  const results = await Promise.allSettled(sources.map(fetchRSSItems));

  let items: ContentItem[] = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
    .filter(({ title, description, source }) => {
      const combined = (title + description).toLowerCase();
      if (source.type === "podcast") return true;
      if (contentType === "women") {
        return combined.includes("arsenal") && WOMEN_KEYWORDS.some(k => combined.includes(k));
      }
      if (source.type === "women") return combined.includes("arsenal");
      return combined.includes("arsenal");
    })
    .map(({ i, title, link, description, pubDate, source }) => ({
      contentId: `${source.name}-${i}-${source.type}`,
      title,
      summary: description.slice(0, 200) + (description.length > 200 ? "..." : ""),
      durationLabel: source.type === "podcast" ? "Podcast" : estimateDuration(description),
      sourceUrl: link,
      sourceName: source.name,
      sourceCountry: source.country,
      contentType: source.type ?? "news",
      publicationDate: parseRSSDate(pubDate),
    }))
    .sort((a, b) => {
      const dA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
      const dB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
      return dB - dA;
    });

  // Deduplicate using 8-word title fingerprint
  items = deduplicateByTitle(items);

  // Limit podcasts and blogs to max 5 per source
  const sourceCount: Record<string, number> = {};
  items = items.filter(item => {
    if (item.contentType !== "podcast" && item.contentType !== "blog") return true;
    const key = `${item.contentType}-${item.sourceName}`;
    sourceCount[key] = (sourceCount[key] || 0) + 1;
    return sourceCount[key] <= 5;
  });

  if (!contentType) {
    const allItems = deduplicateByTitle(
      [...ARSENAL_VIDEOS, ...items].sort((a, b) => {
        const dA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
        const dB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
        return dB - dA;
      })
    );
    setCache(cacheKey, allItems);
    return allItems;
  }

  setCache(cacheKey, items);
  return items;
}

export async function fetchArsenalTransfers(): Promise<TransferItem[]> {
  const cacheKey = "arsenal-transfers";
  const cached = getCached<TransferItem[]>(cacheKey);
  if (cached) return cached;

  const results = await Promise.allSettled(TRANSFER_SOURCES.map(fetchRSSItems));
  const items: TransferItem[] = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
    .filter(({ title, description }) => {
      const combined = (title + description).toLowerCase();
      return combined.includes("arsenal") && TRANSFER_KEYWORDS.some(k => combined.includes(k));
    })
    .map(({ i, title, link, description, pubDate, source }) => ({
      contentId: `${source.name}-transfer-${i}-${Date.now()}`,
      title,
      summary: description.slice(0, 200) + (description.length > 200 ? "..." : ""),
      durationLabel: estimateDuration(description),
      sourceUrl: link,
      sourceName: source.name,
      sourceCountry: source.country,
      transferType: guessTransferType(title + description),
      publicationDate: parseRSSDate(pubDate) ?? new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());

  const deduped = deduplicateByTitle(items);
  setCache(cacheKey, deduped);
  return deduped;
}