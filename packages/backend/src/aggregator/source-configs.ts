/**
 * Default Arsenal news sources from around the world.
 * Content types: news, blog, podcast, video
 */

export interface SourceConfig {
  name: string;
  url: string;
  country: string;
  contentType: "news" | "blog" | "podcast" | "video";
  crawlPriority: number;
  feedType: "rss" | "web";
}

export const DEFAULT_SOURCES: SourceConfig[] = [
  // England
  { name: "Arsenal.com Official", url: "https://www.arsenal.com/news.rss", country: "England", contentType: "news", crawlPriority: 1, feedType: "rss" },
  { name: "BBC Sport - Arsenal", url: "https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml", country: "England", contentType: "news", crawlPriority: 1, feedType: "rss" },
  { name: "The Guardian - Arsenal", url: "https://www.theguardian.com/football/arsenal/rss", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "Sky Sports - Arsenal", url: "https://www.skysports.com/rss/12040", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "The Athletic - Arsenal", url: "https://theathletic.com/team/arsenal/", country: "England", contentType: "news", crawlPriority: 2, feedType: "web" },
  { name: "Football.London - Arsenal", url: "https://www.football.london/arsenal-fc/?service=rss", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  // Blogs
  { name: "Arseblog", url: "https://arseblog.com/feed/", country: "England", contentType: "blog", crawlPriority: 2, feedType: "rss" },
  { name: "101 Great Goals", url: "https://www.101greatgoals.com/feed/", country: "England", contentType: "blog", crawlPriority: 3, feedType: "rss" },
  // International
  { name: "Marca", url: "https://e00-marca.uecdn.es/rss/en/football/premier-league.xml", country: "Spain", contentType: "news", crawlPriority: 3, feedType: "rss" },
  { name: "L'Equipe", url: "https://www.lequipe.fr/rss/actu_rss_Football.xml", country: "France", contentType: "news", crawlPriority: 3, feedType: "rss" },
  { name: "Kicker", url: "https://rss.kicker.de/news/aktuell", country: "Germany", contentType: "news", crawlPriority: 3, feedType: "rss" },
  { name: "Football Italia", url: "https://www.football-italia.net/feed", country: "Italy", contentType: "news", crawlPriority: 3, feedType: "rss" },
  { name: "ESPN FC", url: "https://www.espn.com/espn/rss/soccer/news", country: "USA", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "Goal.com", url: "https://www.goal.com/feeds/en/news", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "FourFourTwo", url: "https://www.fourfourtwo.com/feeds/all", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "90min", url: "https://www.90min.com/posts.rss", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "TEAMtalk", url: "https://www.teamtalk.com/feed", country: "England", contentType: "news", crawlPriority: 2, feedType: "rss" },
  { name: "OneFootball", url: "https://onefootball.com/en/home", country: "Germany", contentType: "news", crawlPriority: 2, feedType: "web" },
  // Podcasts
  { name: "Arseblog - Arsecast", url: "https://arseblog.com/feed/podcast/", country: "England", contentType: "podcast", crawlPriority: 2, feedType: "rss" },
  { name: "The Arsenal Mania Podcast", url: "https://feeds.buzzsprout.com/2132633.rss", country: "England", contentType: "podcast", crawlPriority: 3, feedType: "rss" },
];
