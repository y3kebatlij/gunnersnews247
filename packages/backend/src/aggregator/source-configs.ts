/**
 * Default Arsenal news sources from around the world.
 * These are used to seed the Source Registry in DynamoDB.
 * Each source includes an RSS feed URL where available.
 */

export interface SourceConfig {
  name: string;
  url: string;
  country: string;
  contentType: "article" | "blog" | "newspaper" | "podcast" | "video";
  crawlPriority: number;
  feedType: "rss" | "web";
}

export const DEFAULT_SOURCES: SourceConfig[] = [
  // England
  {
    name: "Arsenal.com Official",
    url: "https://www.arsenal.com/news.rss",
    country: "England",
    contentType: "article",
    crawlPriority: 1,
    feedType: "rss",
  },
  {
    name: "BBC Sport - Arsenal",
    url: "https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 1,
    feedType: "rss",
  },
  {
    name: "The Guardian - Arsenal",
    url: "https://www.theguardian.com/football/arsenal/rss",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "Sky Sports - Arsenal",
    url: "https://www.skysports.com/rss/12040", // Arsenal RSS
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "Arseblog",
    url: "https://arseblog.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "The Athletic - Arsenal",
    url: "https://theathletic.com/team/arsenal/",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    feedType: "web",
  },
  // Spain
  {
    name: "Marca - Arsenal",
    url: "https://e00-marca.uecdn.es/rss/en/football/premier-league.xml",
    country: "Spain",
    contentType: "newspaper",
    crawlPriority: 3,
    feedType: "rss",
  },
  // France
  {
    name: "L'Equipe",
    url: "https://www.lequipe.fr/rss/actu_rss_Football.xml",
    country: "France",
    contentType: "newspaper",
    crawlPriority: 3,
    feedType: "rss",
  },
  // Germany
  {
    name: "Kicker",
    url: "https://rss.kicker.de/news/aktuell",
    country: "Germany",
    contentType: "newspaper",
    crawlPriority: 3,
    feedType: "rss",
  },
  // Italy
  {
    name: "Football Italia",
    url: "https://www.football-italia.net/feed",
    country: "Italy",
    contentType: "newspaper",
    crawlPriority: 3,
    feedType: "rss",
  },
  // USA
  {
    name: "ESPN FC",
    url: "https://www.espn.com/espn/rss/soccer/news",
    country: "USA",
    contentType: "newspaper",
    crawlPriority: 2,
    feedType: "rss",
  },
  // Podcasts
  {
    name: "Arseblog - Arsecast",
    url: "https://arseblog.com/feed/podcast/",
    country: "England",
    contentType: "podcast",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "The Arsenal Mania Podcast",
    url: "https://feeds.buzzsprout.com/2132633.rss",
    country: "England",
    contentType: "podcast",
    crawlPriority: 3,
    feedType: "rss",
  },
  // Requested global football sources
  {
    name: "Goal.com",
    url: "https://www.goal.com/feeds/en/news",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "101 Great Goals",
    url: "https://www.101greatgoals.com/feed/",
    country: "England",
    contentType: "blog",
    crawlPriority: 3,
    feedType: "rss",
  },
  {
    name: "FourFourTwo",
    url: "https://www.fourfourtwo.com/feeds/all",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "90min",
    url: "https://www.90min.com/posts.rss",
    country: "England",
    contentType: "article",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "TEAMtalk",
    url: "https://www.teamtalk.com/feed",
    country: "England",
    contentType: "newspaper",
    crawlPriority: 2,
    feedType: "rss",
  },
  {
    name: "OneFootball",
    url: "https://onefootball.com/en/home",
    country: "Germany",
    contentType: "article",
    crawlPriority: 2,
    feedType: "web",
  },
];
