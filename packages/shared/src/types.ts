/** Valid content types for aggregated items */
export type ContentType = "news" | "blog" | "podcast" | "video";

/** Valid transfer item classifications */
export type TransferType =
  | "rumor"
  | "confirmed_signing"
  | "loan"
  | "contract_extension"
  | "departure";

/** Valid match event types */
export type MatchEventType =
  | "goal"
  | "own_goal"
  | "substitution"
  | "yellow_card"
  | "red_card"
  | "penalty_awarded"
  | "penalty_missed";

/** Match status values */
export type MatchStatus = "scheduled" | "live" | "halftime" | "finished";

/** Input shape for content collected by the Aggregator */
export interface ContentItemInput {
  sourceUrl: string;
  title: string;
  summary: string;
  publicationDate: string; // ISO 8601
  sourceName: string;
  sourceCountry: string;
  contentType: ContentType;
  estimatedDurationMinutes: number | null;
  rawWordCount?: number;
  rawDurationSeconds?: number;
}

/** A single entry in the Source Registry configuration */
export interface SourceRegistryEntry {
  sourceId: string;
  name: string;
  url: string;
  country: string;
  contentType: ContentType;
  crawlPriority: number; // 1 = highest
  enabled: boolean;
}

/** A registered subscriber for the Daily Digest */
export interface Subscriber {
  email: string;
  subscribedAt: string; // ISO 8601
  active: boolean;
  unsubscribeToken?: string;
}

/** The compiled Daily Digest sent to subscribers */
export interface DailyDigest {
  date: string;
  items: DigestItem[];
}

/** A single item within the Daily Digest */
export interface DigestItem {
  title: string;
  summary: string;
  durationLabel: string;
  sourceUrl: string;
  sourceName: string;
  contentType: string;
}

/** Current state of a live or scheduled match */
export interface MatchState {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchMinute: number;
  status: MatchStatus;
  events: MatchEvent[];
}

/** A discrete in-match event (goal, card, substitution, etc.) */
export interface MatchEvent {
  eventId: string;
  matchId: string;
  type: MatchEventType;
  minute: number;
  playerName: string;
  teamName: string;
  detail?: string;
}

/** Lineup data for a single match */
export interface Lineup {
  matchId: string;
  homeTeam: LineupTeam;
  awayTeam: LineupTeam;
}

/** Team-specific lineup details */
export interface LineupTeam {
  teamName: string;
  formation: string;
  startingEleven: Player[];
  substitutes: Player[];
}

/** A single player in a lineup */
export interface Player {
  name: string;
  number: number;
  position: string;
}

/** Payload pushed via WebSocket for real-time notifications */
export interface NotificationPayload {
  type: "goal" | "breaking_news" | "score_update" | "final_score";
  summary: string;
  timestamp: string;
  matchId?: string;
}

/** Classification result for transfer-related content */
export interface TransferItemType {
  isTransfer: true;
  transferType: TransferType;
}

/** Query parameters for the GET /content API endpoint */
export interface ContentQueryParams {
  contentType?: string;
  sourceCountry?: string;
  date?: string;
  limit?: number;
  nextToken?: string;
}

/** A single row in the Standings Table */
export interface StandingsEntry {
  competition: string;
  position: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  recentForm: string[]; // Last 5 results, e.g. ["W","W","D","L","W"]
}

/** Shape of data persisted in browser localStorage */
export interface LocalStorageSchema {
  "arsenal-bookmarks": string[]; // Array of contentId strings
  "arsenal-theme": "light" | "dark";
  "arsenal-filters"?: {
    contentType?: string;
    sourceCountry?: string;
  };
}
