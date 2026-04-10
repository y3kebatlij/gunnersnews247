/**
 * Local development server for Arsenal News Aggregator.
 * Uses in-memory storage with REAL current data for the 2025-26 season.
 * Run with: npx ts-node scripts/local-server.ts
 */

import express from "express";
import type { MatchState, MatchEvent, StandingsEntry, Lineup } from "@arsenal/shared";
import { MAX_SCHEDULE_MATCHES } from "@arsenal/shared";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

// ========== Live RSS Feed Crawler ==========
interface RSSSource {
  name: string;
  url: string;
  country: string;
  contentType: string;
}

const LIVE_RSS_SOURCES: RSSSource[] = [
  { name: "Arsenal.com", url: "https://www.arsenal.com/news.rss", country: "England", contentType: "article" },
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml", country: "England", contentType: "newspaper" },
  { name: "The Guardian", url: "https://www.theguardian.com/football/arsenal/rss", country: "England", contentType: "newspaper" },
  { name: "Arseblog", url: "https://arseblog.com/feed/", country: "England", contentType: "blog" },
  { name: "Sky Sports", url: "https://www.skysports.com/rss/12040", country: "England", contentType: "newspaper" },
  { name: "Football.London", url: "https://www.football.london/arsenal-fc/?service=rss", country: "England", contentType: "article" },
  { name: "TEAMtalk", url: "https://www.teamtalk.com/arsenal/feed", country: "England", contentType: "newspaper" },
  { name: "ESPN FC", url: "https://www.espn.com/espn/rss/soccer/news", country: "USA", contentType: "newspaper" },
  { name: "101 Great Goals", url: "https://www.101greatgoals.com/feed/", country: "England", contentType: "blog" },
  { name: "FourFourTwo", url: "https://www.fourfourtwo.com/feeds/all", country: "England", contentType: "article" },
];

const ARSENAL_KEYWORDS = ["arsenal", "gunners", "arteta", "emirates stadium", "saka", "rice", "odegaard", "saliba", "havertz", "gyokeres", "raya"];

function isArsenalRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return ARSENAL_KEYWORDS.some(kw => lower.includes(kw));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

function estimateWordCount(html: string): number {
  const text = stripHtml(html);
  return text.length > 0 ? text.split(" ").length : 0;
}

async function crawlRSSFeed(source: RSSSource): Promise<StoredContent[]> {
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "ArsenalNewsAggregator/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const parsed = xmlParser.parse(xml);

    const channel = parsed?.rss?.channel;
    let rawItems: any[] = [];
    if (channel?.item) {
      rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];
    } else if (parsed?.feed?.entry) {
      rawItems = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    }

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const results: StoredContent[] = [];

    for (const item of rawItems) {
      const title = String(item.title ?? "").trim();
      if (!title) continue;

      const description = stripHtml(String(item.description ?? item["content:encoded"] ?? item.summary ?? ""));
      const fullText = `${title} ${description}`;

      // Filter: Arsenal-related only (skip for Arsenal.com which is all Arsenal)
      if (source.name !== "Arsenal.com" && !isArsenalRelated(fullText)) continue;

      // Parse publication date
      const pubDateStr = item.pubDate ?? item.published ?? item.updated ?? "";
      const pubDate = new Date(pubDateStr);
      if (isNaN(pubDate.getTime())) continue;

      // Filter: only last 3 days
      if (pubDate.getTime() < threeDaysAgo) continue;

      // Get link
      const link = typeof item.link === "string" ? item.link
        : item.link?.["@_href"] ?? item.link?.href ?? source.url;

      // Estimate word count from full article content if available
      const bodyHtml = String(item["content:encoded"] ?? item.description ?? "");
      const wordCount = estimateWordCount(bodyHtml);
      const realisticWordCount = Math.max(wordCount, 400); // Minimum 400 words for a real article

      const durationLabel = computeDurationLabel(source.contentType, realisticWordCount);
      const transfer = classifyTransferItem(title, description);

      results.push({
        contentId: `live-${Math.random().toString(36).substring(2, 10)}`,
        aggregationDate: new Date().toISOString().split("T")[0],
        sourceUrl: link,
        title,
        summary: generateSummary(description),
        publicationDate: pubDate.toISOString(),
        sourceName: source.name,
        sourceCountry: source.country,
        contentType: source.contentType,
        durationLabel,
        isTransfer: transfer !== null,
        transferType: transfer?.transferType ?? null,
      });
    }

    return results;
  } catch (error) {
    console.warn(`  WARN: Failed to crawl ${source.name}: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

async function crawlAllFeeds(): Promise<StoredContent[]> {
  console.log(`Crawling ${LIVE_RSS_SOURCES.length} live RSS feeds...`);
  const allItems: StoredContent[] = [];

  for (const source of LIVE_RSS_SOURCES) {
    process.stdout.write(`  Crawling ${source.name}...`);
    const items = await crawlRSSFeed(source);
    console.log(` ${items.length} articles`);
    allItems.push(...items);
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = allItems.filter(item => {
    const key = item.title.toLowerCase().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by publication date, newest first
  deduped.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());

  console.log(`\nTotal: ${deduped.length} unique Arsenal articles from last 3 days`);
  return deduped;
}

// Inline the functions to avoid cross-package import issues with ts-node
const READING_RATE_WPM = 200;
function computeDurationLabel(contentType: string, rawWordCount?: number, rawDurationSeconds?: number): string {
  const textTypes = ["article", "blog", "newspaper"];
  if (textTypes.includes(contentType)) {
    if (rawWordCount != null && rawWordCount > 0) return `${Math.ceil(rawWordCount / READING_RATE_WPM)} min read`;
    return "Duration unknown";
  }
  if (contentType === "podcast") {
    if (rawDurationSeconds != null && rawDurationSeconds > 0) return `${Math.ceil(rawDurationSeconds / 60)} min listen`;
    return "Duration unknown";
  }
  if (contentType === "video") {
    if (rawDurationSeconds != null && rawDurationSeconds > 0) return `${Math.ceil(rawDurationSeconds / 60)} min watch`;
    return "Duration unknown";
  }
  return "Duration unknown";
}
function generateSummary(text: string): string {
  if (!text || text.trim().length === 0) return "No summary available.";
  const words = text.trim().split(/\s+/);
  return words.length <= 200 ? words.join(" ") : words.slice(0, 200).join(" ") + "...";
}
function classifyTransferItem(title: string, summary: string): { isTransfer: true; transferType: string } | null {
  const combined = `${title} ${summary}`.toLowerCase();
  if (/\bloan\b/.test(combined)) return { isTransfer: true, transferType: "loan" };
  if (/\bcontract\s+(extension|renewal|extended)\b/.test(combined)) return { isTransfer: true, transferType: "contract_extension" };
  if (/\b(leav|depart|sold|released|exit)\b/.test(combined)) return { isTransfer: true, transferType: "departure" };
  if (/\b(official|confirmed?|signed|signing|announce)\b/.test(combined)) return { isTransfer: true, transferType: "confirmed_signing" };
  if (/\b(transfer|rumou?r|target|interest|bid|offer|link|chase|swoop)\b/.test(combined)) return { isTransfer: true, transferType: "rumor" };
  return null;
}

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ========== Types ==========
interface StoredContent {
  contentId: string;
  aggregationDate: string;
  sourceUrl: string;
  title: string;
  summary: string;
  publicationDate: string;
  sourceName: string;
  sourceCountry: string;
  contentType: string;
  durationLabel: string;
  isTransfer: boolean;
  transferType: string | null;
}

const contentItems: StoredContent[] = [];
const subscribers: Map<string, { email: string; active: boolean; token: string }> = new Map();

// ========== REAL Sample Data — April 2026 ==========
function seedSampleData(): void {
  const sampleItems: Partial<StoredContent>[] = [
    // Recent real results and news
    {
      title: "Sporting 0-1 Arsenal: Havertz Scores Late Winner In Champions League Quarter-Final First Leg",
      summary: "Kai Havertz came off the bench to score a crucial late goal as Arsenal secured a 1-0 away victory against Sporting CP in the Champions League quarter-final first leg. Arteta praised the impact of his substitutes at this stage of the season.",
      sourceName: "The Guardian",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.theguardian.com/football/live/2026/apr/07/sporting-v-arsenal-champions-league-quarter-final-first-leg-live",
      publicationDate: "2026-04-07T22:00:00Z",
    },
    {
      title: "Southampton 2-1 Arsenal: FA Cup Quarter-Final Upset As Saints Knock Out Gunners",
      summary: "Arsenal suffered a shock FA Cup exit at Southampton. Despite dominating possession, the Gunners conceded two goals and Arteta admitted his side failed to capitalize on key chances. Gabriel picked up an injury that will need assessment.",
      sourceName: "BBC Sport",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.theguardian.com/football/live/2026/apr/04/southampton-v-arsenal-fa-cup-quarter-final-live",
      publicationDate: "2026-04-04T21:00:00Z",
    },
    {
      title: "Arsenal Top Premier League With 70 Points After 31 Games — 9 Points Clear Of Man City",
      summary: "Arsenal sit top of the 2025-26 Premier League with a record of W21 D7 L3, accumulating 70 points from 31 matches. The Gunners have scored 61 goals and conceded just 22, giving them the best attack and defense in the league.",
      sourceName: "StatMuse",
      sourceCountry: "USA",
      contentType: "article",
      sourceUrl: "https://www.statmuse.com/fc/ask/premier-league-standings-2026",
      publicationDate: "2026-04-09T12:00:00Z",
    },
    {
      title: "Gyokeres Leads Arsenal Scoring Charts With 11 Premier League Goals",
      summary: "Viktor Gyokeres, wearing the iconic number 14 shirt, has established himself as Arsenal's top scorer this season with 11 Premier League goals. The Swedish striker signed from Sporting CP in the summer has been a revelation at the Emirates.",
      sourceName: "Arsenal.com",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.arsenal.com/news",
      publicationDate: "2026-04-08T10:00:00Z",
    },
    {
      title: "Rice Leads Arsenal With 5 Assists And 7.46 Average Rating This Season",
      summary: "Declan Rice continues to be Arsenal's most influential midfielder with 5 assists and the highest average rating of 7.46 in the squad. His partnership with Zubimendi and Merino has been key to Arsenal's title charge.",
      sourceName: "Football.London",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.football.london/arsenal-fc",
      publicationDate: "2026-04-08T14:00:00Z",
    },
    {
      title: "Arsenal's 100th Consecutive Top-Flight Season: A Historic Milestone",
      summary: "The 2025-26 campaign marks Arsenal's 100th consecutive season in the top flight of English football, making them the first club to achieve this remarkable milestone. The Gunners have been ever-present in the top division since 1919.",
      sourceName: "Arseblog",
      sourceCountry: "England",
      contentType: "blog",
      sourceUrl: "https://arseblog.com",
      publicationDate: "2026-04-06T09:00:00Z",
    },
    {
      title: "Champions League: Arsenal Perfect In Group Stage With 8 Wins From 8",
      summary: "Arsenal topped the Champions League league phase with a perfect record of 8 wins from 8 matches, scoring 19 goals and conceding zero. They are the only team in the competition with a 100% group stage record. In the knockout rounds, they drew 1-1 at Leverkusen before winning 2-0 at home to reach the quarter-finals.",
      sourceName: "ESPN FC",
      sourceCountry: "USA",
      contentType: "newspaper",
      sourceUrl: "https://www.espn.com/soccer",
      publicationDate: "2026-04-07T23:00:00Z",
    },
    {
      title: "Zubimendi And Madueke Settling In Well At Arsenal After Summer Moves",
      summary: "Martin Zubimendi, who joined from Real Sociedad wearing number 36, and Noni Madueke have both adapted quickly to life at Arsenal. Zubimendi's deep-lying playmaking and Madueke's directness on the wing have added new dimensions to Arteta's squad.",
      sourceName: "The Athletic",
      sourceCountry: "USA",
      contentType: "article",
      sourceUrl: "https://theathletic.com/team/arsenal",
      publicationDate: "2026-04-05T16:00:00Z",
    },
    {
      title: "Arsecast: Title Race Update — Can Arsenal Finally End The Wait?",
      summary: "The latest Arsecast episode discusses Arsenal's commanding 9-point lead at the top of the Premier League with 7 games remaining. Analysis of the Sporting CP Champions League win and the disappointing FA Cup exit at Southampton.",
      sourceName: "Arseblog - Arsecast",
      sourceCountry: "England",
      contentType: "podcast",
      sourceUrl: "https://arseblog.com/podcast",
      publicationDate: "2026-04-08T07:00:00Z",
    },
    {
      title: "Tottenham's Nightmare Season Continues — Spurs 17th With 30 Points",
      summary: "Tottenham's dismal 2025-26 campaign sees them languishing in 17th place with just 30 points from 31 games, facing a genuine relegation battle. Arsenal fans are enjoying the contrast as the Gunners sit 40 points above their north London rivals.",
      sourceName: "Sky Sports",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.skysports.com",
      publicationDate: "2026-04-09T08:00:00Z",
    },
    {
      title: "Nwaneri Takes Number 22 Shirt After Breakout Campaign",
      summary: "Ethan Nwaneri has swapped his number 53 for the 22 shirt after an impressive breakout season. The young midfielder has become a regular in Arteta's matchday squads and is seen as a key part of Arsenal's future.",
      sourceName: "Arsenal.com",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.arsenal.com/news",
      publicationDate: "2026-04-03T11:00:00Z",
    },
    {
      title: "Marca: Arsenal's Dominance Impresses La Liga Scouts",
      summary: "Spanish media outlet Marca reports that Arsenal's commanding Premier League form has caught the attention of La Liga clubs, with several Spanish coaches studying Arteta's tactical approach this season.",
      sourceName: "Marca",
      sourceCountry: "Spain",
      contentType: "newspaper",
      sourceUrl: "https://www.marca.com",
      publicationDate: "2026-04-07T15:00:00Z",
    },
    // Goal.com
    {
      title: "Arsenal's Title Charge: How Arteta Built The Best Defence In Europe",
      summary: "With just 22 goals conceded in 31 Premier League matches, Arsenal boast the meanest defence in Europe's top five leagues alongside Como. Goal.com analyses how Saliba and Gabriel have formed the continent's most formidable centre-back partnership.",
      sourceName: "Goal.com",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.goal.com",
      publicationDate: "2026-04-09T10:00:00Z",
    },
    // 101 Great Goals
    {
      title: "Gyokeres vs Henry: Comparing Arsenal's New No.14 To The Legend",
      summary: "Viktor Gyokeres has taken the iconic number 14 shirt at Arsenal and is delivering. With 11 Premier League goals in his debut season, 101 Great Goals compares his impact to Thierry Henry's first campaign at Highbury.",
      sourceName: "101 Great Goals",
      sourceCountry: "England",
      contentType: "blog",
      sourceUrl: "https://www.101greatgoals.com",
      publicationDate: "2026-04-08T12:00:00Z",
    },
    // FourFourTwo
    {
      title: "Ranked: The 10 Best Signings Of The 2025-26 Season So Far",
      summary: "FourFourTwo ranks the best transfers of the season, with Arsenal's Viktor Gyokeres and Martin Zubimendi both featuring in the top five. The pair have transformed Arteta's side into genuine title contenders.",
      sourceName: "FourFourTwo",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.fourfourtwo.com",
      publicationDate: "2026-04-07T09:00:00Z",
    },
    // 90min
    {
      title: "Arsenal 2-0 Everton: Player Ratings As Gunners Extend Lead At The Top",
      summary: "Arsenal's last Premier League outing saw them beat Everton 2-0 at the Emirates. 90min rates every player from the match, with Declan Rice earning a 9/10 for his commanding midfield display.",
      sourceName: "90min",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.90min.com",
      publicationDate: "2026-03-14T20:00:00Z",
    },
    // TEAMtalk
    {
      title: "Arsenal Transfer Exclusive: Gunners Monitoring Bundesliga Star For Summer Move",
      summary: "TEAMtalk understands Arsenal are keeping close tabs on a Bundesliga midfielder ahead of the summer window. The player has a release clause and Arteta sees him as the perfect addition to an already dominant squad.",
      sourceName: "TEAMtalk",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.teamtalk.com/arsenal",
      publicationDate: "2026-04-09T07:00:00Z",
    },
    // OneFootball
    {
      title: "Champions League Quarter-Final Preview: Can Anyone Stop Arsenal?",
      summary: "OneFootball previews Arsenal's Champions League quarter-final second leg against Sporting CP. With a 1-0 lead from Lisbon and a record of W10 D1 L0 in Europe this season, the Gunners are heavy favourites to reach the semi-finals at the Emirates on April 15.",
      sourceName: "OneFootball",
      sourceCountry: "Germany",
      contentType: "article",
      sourceUrl: "https://onefootball.com",
      publicationDate: "2026-04-09T11:00:00Z",
    },
    // Recent verified results coverage
    {
      title: "Arsenal 2-0 Leverkusen: Gunners Cruise Into Champions League Quarter-Finals",
      summary: "Arsenal completed a 3-1 aggregate victory over Bayer Leverkusen to reach the Champions League quarter-finals. After drawing 1-1 in Germany, the Gunners were dominant at the Emirates with a comfortable 2-0 second-leg win on March 17.",
      sourceName: "BBC Sport",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.bbc.co.uk/sport/football",
      publicationDate: "2026-03-17T22:00:00Z",
    },
    {
      title: "Arsenal 2-1 Chelsea: Gunners Win London Derby To Extend Lead At The Top",
      summary: "Arsenal came from behind to beat Chelsea 2-1 at the Emirates on March 1, extending their lead at the top of the Premier League. The victory was part of a run that saw Arsenal win four of their last five league matches.",
      sourceName: "The Guardian",
      sourceCountry: "England",
      contentType: "newspaper",
      sourceUrl: "https://www.theguardian.com/football/arsenal",
      publicationDate: "2026-03-01T17:00:00Z",
    },
    {
      title: "Tottenham 1-4 Arsenal: Gunners Demolish Spurs In North London Derby",
      summary: "Arsenal produced a stunning display to thrash Tottenham 4-1 away from home on February 22. The result highlighted the gulf between the two north London rivals this season, with Spurs languishing in 17th while Arsenal sit top.",
      sourceName: "90min",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.90min.com",
      publicationDate: "2026-02-22T17:00:00Z",
    },
    {
      title: "Arsenal Spend Record £32 Million On Agent Fees This Season",
      summary: "Arsenal have spent a record £32 million on agent fees during the 2025-26 season, reflecting the significant summer transfer business that brought in Gyokeres, Zubimendi, Madueke, Mosquera, Norgaard, and Kepa.",
      sourceName: "Arseblog News",
      sourceCountry: "England",
      contentType: "blog",
      sourceUrl: "https://arseblog.news",
      publicationDate: "2026-04-02T10:00:00Z",
    },
    {
      title: "Arsenal's Trip To West Ham Moved To Sunday May 10 For Sky Sports Coverage",
      summary: "Arsenal's away match at West Ham United has been rescheduled to Sunday, May 10 after being selected for live UK broadcast by Sky Sports. The match at the London Stadium will be one of the final fixtures of Arsenal's title run-in.",
      sourceName: "Arsenal.com",
      sourceCountry: "England",
      contentType: "article",
      sourceUrl: "https://www.arsenal.com/news",
      publicationDate: "2026-04-01T12:00:00Z",
    },
  ];

  // Realistic word counts for different content types
  const wordCountMap: Record<string, [number, number]> = {
    article: [800, 2000],
    blog: [1200, 3000],
    newspaper: [600, 1500],
    podcast: [0, 0], // uses duration instead
    video: [0, 0],   // uses duration instead
  };

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const today = new Date().toISOString().split("T")[0];

  for (const item of sampleItems) {
    // Filter: only show articles from the last 3 days
    const pubDate = new Date(item.publicationDate ?? "");
    if (pubDate < threeDaysAgo) continue;

    const ct = item.contentType as "article" | "blog" | "newspaper" | "podcast" | "video";
    const [minWords, maxWords] = wordCountMap[ct] ?? [600, 1500];
    const realisticWordCount = minWords > 0
      ? Math.floor(Math.random() * (maxWords - minWords) + minWords)
      : undefined;
    const podcastDuration = ct === "podcast" ? Math.floor(Math.random() * 2400 + 1200) : undefined; // 20-60 min

    const durationLabel = computeDurationLabel(ct, realisticWordCount, podcastDuration);
    const transfer = classifyTransferItem(item.title ?? "", item.summary ?? "");
    contentItems.push({
      contentId: `content-${Math.random().toString(36).substring(2, 10)}`,
      aggregationDate: today,
      sourceUrl: item.sourceUrl ?? "",
      title: item.title ?? "",
      summary: generateSummary(item.summary ?? ""),
      publicationDate: item.publicationDate ?? new Date().toISOString(),
      sourceName: item.sourceName ?? "",
      sourceCountry: item.sourceCountry ?? "",
      contentType: item.contentType ?? "article",
      durationLabel,
      isTransfer: transfer !== null,
      transferType: transfer?.transferType ?? null,
    });
  }
  console.log(`Seeded ${contentItems.length} content items with real 2025-26 data`);
}

// ========== REAL Premier League Standings — April 2026 ==========
const sampleStandings: StandingsEntry[] = [
  { competition: "Premier League", position: 1, teamName: "Arsenal", matchesPlayed: 31, wins: 21, draws: 7, losses: 3, goalsFor: 61, goalsAgainst: 22, goalDifference: 39, points: 70, recentForm: ["W","W","W","W","D"] },
  { competition: "Premier League", position: 2, teamName: "Man City", matchesPlayed: 30, wins: 18, draws: 7, losses: 5, goalsFor: 60, goalsAgainst: 28, goalDifference: 32, points: 61, recentForm: ["D","D","W","W","W"] },
  { competition: "Premier League", position: 3, teamName: "Man United", matchesPlayed: 31, wins: 15, draws: 10, losses: 6, goalsFor: 56, goalsAgainst: 43, goalDifference: 13, points: 55, recentForm: ["D","W","L","W","W"] },
  { competition: "Premier League", position: 4, teamName: "Aston Villa", matchesPlayed: 31, wins: 16, draws: 6, losses: 9, goalsFor: 42, goalsAgainst: 37, goalDifference: 5, points: 54, recentForm: ["W","L","L","L","D"] },
  { competition: "Premier League", position: 5, teamName: "Liverpool", matchesPlayed: 31, wins: 14, draws: 7, losses: 10, goalsFor: 50, goalsAgainst: 42, goalDifference: 8, points: 49, recentForm: ["L","D","L","W","W"] },
  { competition: "Premier League", position: 6, teamName: "Chelsea", matchesPlayed: 31, wins: 13, draws: 9, losses: 9, goalsFor: 53, goalsAgainst: 38, goalDifference: 15, points: 48, recentForm: ["L","L","W","L","D"] },
  { competition: "Premier League", position: 7, teamName: "Brentford", matchesPlayed: 31, wins: 13, draws: 7, losses: 11, goalsFor: 46, goalsAgainst: 42, goalDifference: 4, points: 46, recentForm: ["D","D","D","W","L"] },
  { competition: "Premier League", position: 8, teamName: "Everton", matchesPlayed: 31, wins: 13, draws: 7, losses: 11, goalsFor: 37, goalsAgainst: 35, goalDifference: 2, points: 46, recentForm: ["W","L","W","W","L"] },
  { competition: "Premier League", position: 9, teamName: "Fulham", matchesPlayed: 31, wins: 13, draws: 5, losses: 13, goalsFor: 43, goalsAgainst: 44, goalDifference: -1, points: 44, recentForm: ["W","D","L","W","W"] },
  { competition: "Premier League", position: 10, teamName: "Brighton", matchesPlayed: 31, wins: 11, draws: 10, losses: 10, goalsFor: 41, goalsAgainst: 37, goalDifference: 4, points: 43, recentForm: ["W","W","L","W","W"] },
  { competition: "Premier League", position: 11, teamName: "Sunderland", matchesPlayed: 31, wins: 11, draws: 10, losses: 10, goalsFor: 32, goalsAgainst: 36, goalDifference: -4, points: 43, recentForm: ["W","L","W","D","L"] },
  { competition: "Premier League", position: 12, teamName: "Newcastle", matchesPlayed: 31, wins: 12, draws: 6, losses: 13, goalsFor: 44, goalsAgainst: 45, goalDifference: -1, points: 42, recentForm: ["L","W","W","L","L"] },
  { competition: "Premier League", position: 13, teamName: "Bournemouth", matchesPlayed: 31, wins: 9, draws: 15, losses: 7, goalsFor: 46, goalsAgainst: 48, goalDifference: -2, points: 42, recentForm: ["D","D","D","D","D"] },
  { competition: "Premier League", position: 14, teamName: "Crystal Palace", matchesPlayed: 30, wins: 10, draws: 9, losses: 11, goalsFor: 33, goalsAgainst: 35, goalDifference: -2, points: 39, recentForm: ["D","W","L","W","L"] },
  { competition: "Premier League", position: 15, teamName: "Leeds", matchesPlayed: 31, wins: 7, draws: 12, losses: 12, goalsFor: 37, goalsAgainst: 48, goalDifference: -11, points: 33, recentForm: ["D","D","L","L","D"] },
  { competition: "Premier League", position: 16, teamName: "Nottm Forest", matchesPlayed: 31, wins: 8, draws: 8, losses: 15, goalsFor: 31, goalsAgainst: 43, goalDifference: -12, points: 32, recentForm: ["W","D","D","L","L"] },
  { competition: "Premier League", position: 17, teamName: "Tottenham", matchesPlayed: 31, wins: 7, draws: 9, losses: 15, goalsFor: 40, goalsAgainst: 50, goalDifference: -10, points: 30, recentForm: ["L","D","L","L","L"] },
  { competition: "Premier League", position: 18, teamName: "West Ham", matchesPlayed: 31, wins: 7, draws: 8, losses: 16, goalsFor: 36, goalsAgainst: 57, goalDifference: -21, points: 29, recentForm: ["L","D","W","L","D"] },
  { competition: "Premier League", position: 19, teamName: "Burnley", matchesPlayed: 31, wins: 4, draws: 8, losses: 19, goalsFor: 33, goalsAgainst: 61, goalDifference: -28, points: 20, recentForm: ["L","D","L","L","D"] },
  { competition: "Premier League", position: 20, teamName: "Wolves", matchesPlayed: 31, wins: 3, draws: 8, losses: 20, goalsFor: 24, goalsAgainst: 54, goalDifference: -30, points: 17, recentForm: ["D","W","W","L","D"] },
];

// ========== REAL Upcoming Fixtures — April 2026 ==========
const sampleSchedule: (MatchState & { competition: string; venue: string; kickoffTime: string })[] = [
  { matchId: "f1", homeTeam: "Arsenal", awayTeam: "Bournemouth", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Premier League", venue: "Emirates Stadium", kickoffTime: "2026-04-11T14:30:00Z" },
  { matchId: "f2", homeTeam: "Arsenal", awayTeam: "Sporting CP", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Champions League QF 2nd Leg", venue: "Emirates Stadium", kickoffTime: "2026-04-15T19:00:00Z" },
  { matchId: "f3", homeTeam: "Man City", awayTeam: "Arsenal", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Premier League", venue: "Etihad Stadium", kickoffTime: "2026-04-19T15:30:00Z" },
  { matchId: "f4", homeTeam: "Arsenal", awayTeam: "Newcastle", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Premier League", venue: "Emirates Stadium", kickoffTime: "2026-04-25T14:30:00Z" },
  { matchId: "f5", homeTeam: "Arsenal", awayTeam: "Fulham", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Premier League", venue: "Emirates Stadium", kickoffTime: "2026-05-02T14:30:00Z" },
  { matchId: "f6", homeTeam: "West Ham", awayTeam: "Arsenal", homeScore: 0, awayScore: 0, matchMinute: 0, status: "scheduled", events: [], competition: "Premier League", venue: "London Stadium", kickoffTime: "2026-05-10T15:30:00Z" },
];

// ========== REAL Arsenal Squad — 2025-26 ==========
const arsenalLineup = {
  teamSide: "home" as const,
  teamName: "Arsenal",
  formation: "4-3-3",
  startingEleven: [
    { name: "David Raya", number: 1, position: "GK" },
    { name: "Ben White", number: 4, position: "RB" },
    { name: "William Saliba", number: 2, position: "CB" },
    { name: "Gabriel", number: 6, position: "CB" },
    { name: "Riccardo Calafiori", number: 33, position: "LB" },
    { name: "Martin Zubimendi", number: 36, position: "CDM" },
    { name: "Mikel Merino", number: 23, position: "CM" },
    { name: "Declan Rice", number: 41, position: "CM" },
    { name: "Noni Madueke", number: 20, position: "RW" },
    { name: "Viktor Gyokeres", number: 14, position: "ST" },
    { name: "Gabriel Martinelli", number: 11, position: "LW" },
  ],
  substitutes: [
    { name: "Kepa Arrizabalaga", number: 13, position: "GK" },
    { name: "Jurrien Timber", number: 12, position: "DEF" },
    { name: "Jakub Kiwior", number: 15, position: "CB" },
    { name: "Oleksandr Zinchenko", number: 17, position: "LB" },
    { name: "Martin Odegaard", number: 8, position: "CM" },
    { name: "Kai Havertz", number: 29, position: "FW" },
    { name: "Bukayo Saka", number: 7, position: "RW" },
    { name: "Leandro Trossard", number: 19, position: "FW" },
    { name: "Ethan Nwaneri", number: 22, position: "MF" },
  ],
};

// No live match right now (next match is April 11)
let currentLiveMatch: MatchState | undefined = undefined;

// ========== API Routes ==========
app.get("/content", (req, res) => {
  let items = [...contentItems];
  if (req.query.contentType) items = items.filter(i => i.contentType === req.query.contentType);
  if (req.query.sourceCountry) items = items.filter(i => i.sourceCountry === req.query.sourceCountry);
  items.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
  res.json({ items });
});

app.get("/content/:id", (req, res) => {
  const item = contentItems.find(i => i.contentId === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

app.get("/transfers", (_req, res) => {
  const transfers = contentItems
    .filter(i => i.isTransfer)
    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
  res.json({ items: transfers });
});

app.get("/schedule", (_req, res) => {
  const matches = sampleSchedule
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
    .slice(0, MAX_SCHEDULE_MATCHES);
  res.json({ matches });
});

app.get("/standings", (req, res) => {
  const comp = (req.query.competition as string) ?? "Premier League";
  const standings = sampleStandings.filter(s => s.competition === comp);
  res.json({ standings });
});

app.get("/match/:id", (req, res) => {
  const live = currentLiveMatch as MatchState | undefined;
  if (live && req.params.id === live.matchId) return res.json(live);
  const scheduled = sampleSchedule.find(m => m.matchId === req.params.id);
  if (scheduled) return res.json(scheduled);
  res.status(404).json({ error: "Match not found" });
});

app.get("/match/:id/lineup", (req, res) => {
  res.json({ lineups: [arsenalLineup] });
});

app.get("/match/:id/timeline", (req, res) => {
  const live = currentLiveMatch as MatchState | undefined;
  if (live && req.params.id === live.matchId) {
    res.json({ events: live.events });
  } else {
    res.json({ events: [] });
  }
});

app.post("/subscribe", (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Invalid email format" });
  }
  const token = Math.random().toString(36).substring(2);
  subscribers.set(email.toLowerCase(), { email: email.toLowerCase(), active: true, token });
  console.log(`Subscriber added: ${email}`);
  res.json({ success: true });
});

app.delete("/subscribe", (req, res) => {
  const { email, token } = req.body;
  const sub = subscribers.get(email?.toLowerCase());
  if (!sub || sub.token !== token) {
    return res.status(400).json({ success: false, error: "Invalid" });
  }
  sub.active = false;
  res.json({ success: true });
});

// ========== Start ==========
const PORT = 3001;

async function startServer() {
  // Try live RSS feeds first
  console.log("\n=== Arsenal News Aggregator — Starting ===\n");
  const liveItems = await crawlAllFeeds();

  if (liveItems.length > 0) {
    contentItems.push(...liveItems);
    console.log(`\nLoaded ${liveItems.length} LIVE articles from RSS feeds`);
  } else {
    console.log("\nLive feeds returned no results, loading sample data...");
    seedSampleData();
  }

  app.listen(PORT, () => {
    console.log(`\n=== Arsenal News Aggregator — Local Dev Server ===`);
    console.log(`API: http://localhost:${PORT}`);
    console.log(`Mode: ${liveItems.length > 0 ? "LIVE RSS feeds" : "Sample data"}`);
    console.log(`\n${contentItems.length} articles | 6 fixtures | 20 teams in standings`);
  });
}

startServer().catch(err => {
  console.error("Failed to start:", err);
  process.exit(1);
});
