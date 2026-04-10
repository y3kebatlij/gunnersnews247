import type { ContentType, TransferType, MatchEventType } from "./types";

/** All valid content types (Req 1.3) */
export const CONTENT_TYPES: readonly ContentType[] = [
  "article",
  "blog",
  "newspaper",
  "podcast",
  "video",
] as const;

/** All valid transfer item classifications (Req 11.2) */
export const TRANSFER_TYPES: readonly TransferType[] = [
  "rumor",
  "confirmed_signing",
  "loan",
  "contract_extension",
  "departure",
] as const;

/** All valid match event types (Req 13.4) */
export const MATCH_EVENT_TYPES: readonly MatchEventType[] = [
  "goal",
  "own_goal",
  "substitution",
  "yellow_card",
  "red_card",
  "penalty_awarded",
  "penalty_missed",
] as const;

/** Duration label format strings (Req 2.5) */
export const DURATION_FORMAT_READ = "min read";
export const DURATION_FORMAT_LISTEN = "min listen";
export const DURATION_FORMAT_WATCH = "min watch";
export const DURATION_UNKNOWN = "Duration unknown";

/** Reading rate used to estimate text content duration (Req 2.2) */
export const READING_RATE_WPM = 200;

/** Maximum words allowed in a generated summary (Req 1.7) */
export const MAX_SUMMARY_WORDS = 200;

/** Maximum upcoming matches shown in Schedule View (Req 6.1) */
export const MAX_SCHEDULE_MATCHES = 10;

/** Auto-dismiss timeout for notification banner in milliseconds (Req 7.4) */
export const NOTIFICATION_AUTO_DISMISS_MS = 15_000;

/** Number of recent form results displayed in Standings Table (Req 14.7) */
export const FORM_RESULTS_COUNT = 5;
