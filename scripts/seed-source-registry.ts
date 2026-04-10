/**
 * Seed script to populate the SourceRegistry DynamoDB table.
 * Run with: npx ts-node scripts/seed-source-registry.ts
 * 
 * Requires AWS credentials configured (via env vars or ~/.aws/credentials).
 * Uses the table name from DYNAMODB_SOURCE_REGISTRY_TABLE env var or defaults to "SourceRegistry".
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_SOURCE_REGISTRY_TABLE ?? "SourceRegistry";

interface SourceEntry {
  sourceId: string;
  name: string;
  url: string;
  country: string;
  contentType: "article" | "blog" | "newspaper" | "podcast" | "video";
  crawlPriority: number;
  enabled: boolean;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

const SOURCES: Omit<SourceEntry, "sourceId">[] = [
  // ===== ENGLAND =====
  {
    name: "Arsenal.com Official News",
    url: "https://www.arsenal.com/news.rss",
    country: "England",
    contentType: "article",
    crawlPriority: 1,
    enabled: true,
  },
  {
    name: "BBC Sport - Arsenal",
    url: "https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 1,
    enabled: true,
  },
  {
    name: "The Guardian - Arsenal",
    url: "https://www.theguardian.com/football/arsenal/rss",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "Sky Sports - Arsenal",
    url: "https://www.skysports.com/rss/12040",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "The Telegraph - Arsenal",
    url: "https://www.telegraph.co.uk/arsenal/rss.xml",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "Mirror Football - Arsenal",
    url: "https://www.mirror.co.uk/sport/football/news/?service=rss",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Evening Standard - Arsenal",
    url: "https://www.standard.co.uk/sport/football/arsenal/rss",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Football.London - Arsenal",
    url: "https://www.football.london/arsenal-fc/?service=rss",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    enabled: true,
  },

  // ===== ENGLAND - BLOGS =====
  {
    name: "Arseblog",
    url: "https://arseblog.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 1,
    enabled: true,
  },
  {
    name: "Arsenal Vision",
    url: "https://arsenalvision.co.uk/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Gunners Town",
    url: "https://gunnerstown.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Just Arsenal",
    url: "https://justarsenal.com/feed",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "The Short Fuse (SB Nation)",
    url: "https://www.theshortfuse.com/rss/current",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Pain in the Arsenal",
    url: "https://paininthearsenal.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== SPAIN =====
  {
    name: "Marca - Premier League",
    url: "https://e00-marca.uecdn.es/rss/en/football/premier-league.xml",
    country: "Spain",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "AS English - Football",
    url: "https://en.as.com/rss/en/football.xml",
    country: "Spain",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== FRANCE =====
  {
    name: "L'Equipe - Football",
    url: "https://www.lequipe.fr/rss/actu_rss_Football.xml",
    country: "France",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "RMC Sport",
    url: "https://rmcsport.bfmtv.com/rss/football/",
    country: "France",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== GERMANY =====
  {
    name: "Kicker",
    url: "https://rss.kicker.de/news/aktuell",
    country: "Germany",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Sport1",
    url: "https://www.sport1.de/rss/fussball",
    country: "Germany",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== ITALY =====
  {
    name: "Football Italia",
    url: "https://www.football-italia.net/feed",
    country: "Italy",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Calciomercato (English)",
    url: "https://www.calciomercato.com/en/feed",
    country: "Italy",
    contentType: "newspaper",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== USA =====
  {
    name: "ESPN FC",
    url: "https://www.espn.com/espn/rss/soccer/news",
    country: "USA",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "NBC Sports - Premier League",
    url: "https://www.nbcsports.com/soccer/rss",
    country: "USA",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "The Athletic - Arsenal",
    url: "https://theathletic.com/team/arsenal/",
    country: "USA",
    contentType: "article",
    crawlPriority: 2,
    enabled: true,
  },

  // ===== BRAZIL =====
  {
    name: "Globo Esporte - Futebol Internacional",
    url: "https://ge.globo.com/rss/futebol/futebol-internacional/",
    country: "Brazil",
    contentType: "newspaper",
    crawlPriority: 4,
    enabled: true,
  },

  // ===== ARGENTINA =====
  {
    name: "Ole - Futbol Internacional",
    url: "https://www.ole.com.ar/rss/futbol-internacional/",
    country: "Argentina",
    contentType: "newspaper",
    crawlPriority: 4,
    enabled: true,
  },

  // ===== NIGERIA =====
  {
    name: "Complete Sports Nigeria",
    url: "https://www.completesports.com/feed/",
    country: "Nigeria",
    contentType: "newspaper",
    crawlPriority: 4,
    enabled: true,
  },

  // ===== INDIA =====
  {
    name: "Sportskeeda Football",
    url: "https://www.sportskeeda.com/feed/football",
    country: "India",
    contentType: "article",
    crawlPriority: 4,
    enabled: true,
  },

  // ===== AUSTRALIA =====
  {
    name: "The World Game (SBS)",
    url: "https://www.sbs.com.au/news/topic/the-world-game/feed",
    country: "Australia",
    contentType: "newspaper",
    crawlPriority: 4,
    enabled: true,
  },

  // ===== PODCASTS =====
  {
    name: "Arseblog - Arsecast",
    url: "https://arseblog.com/feed/podcast/",
    country: "England",
    contentType: "podcast",
    crawlPriority: 1,
    enabled: true,
  },
  {
    name: "The Arsenal Mania Podcast",
    url: "https://feeds.buzzsprout.com/2132633.rss",
    country: "England",
    contentType: "podcast",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "Handbrake Off - Arsenal Podcast",
    url: "https://feeds.acast.com/public/shows/handbrake-off",
    country: "England",
    contentType: "podcast",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "Arsenal Vision Podcast",
    url: "https://feeds.megaphone.fm/arsenalvision",
    country: "England",
    contentType: "podcast",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "Gunnerblog Podcast",
    url: "https://audioboom.com/channels/5023160.rss",
    country: "England",
    contentType: "podcast",
    crawlPriority: 3,
    enabled: true,
  },

  // ===== VIDEO =====
  {
    name: "Arsenal Official YouTube",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCpryVRk_VDudG8SHXgWcG0w",
    country: "England",
    contentType: "video",
    crawlPriority: 1,
    enabled: true,
  },
  {
    name: "AFTV (Arsenal Fan TV)",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBTy8j2cPy6zw68godcE7MQ",
    country: "England",
    contentType: "video",
    crawlPriority: 2,
    enabled: true,
  },

  // ===== GLOBAL FOOTBALL AGGREGATORS =====
  {
    name: "Goal.com",
    url: "https://www.goal.com/feeds/en/news",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "101 Great Goals",
    url: "https://www.101greatgoals.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    enabled: true,
  },
  {
    name: "FourFourTwo",
    url: "https://www.fourfourtwo.com/feeds/all",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "90min",
    url: "https://www.90min.com/posts.rss",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "TEAMtalk",
    url: "https://www.teamtalk.com/feed",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    enabled: true,
  },
  {
    name: "OneFootball",
    url: "https://onefootball.com/en/home",
    country: "Germany",
    contentType: "article",
    crawlPriority: 2,
    enabled: true,
  },
];

async function seed(): Promise<void> {
  console.log(`Seeding ${SOURCES.length} sources into ${TABLE_NAME}...`);

  // Check existing entries
  const existing = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  const existingUrls = new Set((existing.Items ?? []).map((item) => item.url as string));

  let added = 0;
  let skipped = 0;

  for (const source of SOURCES) {
    if (existingUrls.has(source.url)) {
      console.log(`  SKIP (exists): ${source.name}`);
      skipped++;
      continue;
    }

    const entry: SourceEntry = {
      sourceId: generateId("src"),
      ...source,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: entry,
      })
    );

    console.log(`  ADDED: ${source.name} (${source.country}, ${source.contentType})`);
    added++;
  }

  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}, Total in registry: ${added + (existing.Items?.length ?? 0)}`);

  // Print coverage summary
  const countries = new Set(SOURCES.map((s) => s.country));
  const types = new Set(SOURCES.map((s) => s.contentType));
  console.log(`\nCoverage: ${countries.size} countries, ${types.size} content types`);
  console.log(`Countries: ${[...countries].join(", ")}`);
  console.log(`Types: ${[...types].join(", ")}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
