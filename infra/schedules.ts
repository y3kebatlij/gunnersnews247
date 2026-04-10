/**
 * EventBridge schedule rule definitions for the Arsenal News Aggregator.
 */

export interface ScheduleRule {
  name: string;
  description: string;
  /** Cron expression in EventBridge format (UTC) */
  schedule: string;
  targetLambda: string;
  input: Record<string, unknown>;
}

export const SCHEDULE_RULES: ScheduleRule[] = [
  {
    name: "AggregatorDailyTrigger",
    description: "Trigger daily aggregation at 08:00 EST (13:00 UTC)",
    schedule: "cron(0 13 * * ? *)",
    targetLambda: "aggregator-handler",
    input: { source: "eventbridge", detail: { cycle: "daily" } },
  },
  {
    name: "DigestDailyTrigger",
    description: "Trigger daily digest delivery at 09:00 EST (14:00 UTC)",
    schedule: "cron(0 14 * * ? *)",
    targetLambda: "digest-handler",
    input: { source: "eventbridge", detail: { schedule: "daily-digest" } },
  },
  {
    name: "MatchDataPolling",
    description: "Poll match data every 1 minute (enable during match windows only)",
    schedule: "rate(1 minute)",
    targetLambda: "match-handler",
    input: {},
  },
];
