import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { MatchState, MatchEvent, NotificationPayload, StandingsEntry } from "@arsenal/shared";
import {
  fetchArsenalMatchState,
  fetchUpcomingMatches,
  fetchMatchLineup,
  fetchStandings,
} from "./football-data-client";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MATCHES_TABLE = process.env.DYNAMODB_MATCHES_TABLE ?? "Matches";
const MATCH_EVENTS_TABLE = process.env.DYNAMODB_MATCH_EVENTS_TABLE ?? "MatchEvents";
const LINEUPS_TABLE = process.env.DYNAMODB_LINEUPS_TABLE ?? "Lineups";
const STANDINGS_TABLE = process.env.DYNAMODB_STANDINGS_TABLE ?? "Standings";

/**
 * Detect new events by comparing previous and current match states.
 * Returns events present in current but not in previous.
 */
export function detectNewEvents(
  previous: MatchState,
  current: MatchState
): MatchEvent[] {
  const previousIds = new Set(previous.events.map((e: MatchEvent) => e.eventId));
  return current.events.filter((e: MatchEvent) => !previousIds.has(e.eventId));
}

/**
 * Convert a match event into a notification payload for broadcasting.
 */
export function eventToNotification(event: MatchEvent): NotificationPayload | null {
  if (event.type === "goal" || event.type === "own_goal") {
    const label = event.type === "own_goal" ? "OWN GOAL" : "GOAL";
    return {
      type: "goal",
      summary: `${label}! ${event.playerName} (${event.teamName}) ${event.minute}'`,
      timestamp: new Date().toISOString(),
      matchId: event.matchId,
    };
  }
  return null;
}

/** Store or update match state in DynamoDB */
async function updateMatchState(match: MatchState): Promise<void> {
  const matchDate = new Date().toISOString().split("T")[0];
  await docClient.send(
    new PutCommand({
      TableName: MATCHES_TABLE,
      Item: {
        matchId: match.matchId,
        matchDate,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchMinute: match.matchMinute,
        status: match.status,
      },
    })
  );
}

/** Store new match events in DynamoDB */
async function storeMatchEvents(events: MatchEvent[]): Promise<void> {
  for (const event of events) {
    await docClient.send(
      new PutCommand({
        TableName: MATCH_EVENTS_TABLE,
        Item: {
          matchId: event.matchId,
          eventId: event.eventId,
          type: event.type,
          minute: event.minute,
          playerName: event.playerName,
          teamName: event.teamName,
          detail: event.detail ?? null,
        },
      })
    );
  }
}

/** Store upcoming matches in DynamoDB */
async function storeUpcomingMatches(matches: MatchState[]): Promise<void> {
  for (const match of matches) {
    await docClient.send(
      new PutCommand({
        TableName: MATCHES_TABLE,
        Item: {
          matchId: match.matchId,
          matchDate: (match as MatchState & { kickoffTime?: string }).kickoffTime?.split("T")[0] ?? new Date().toISOString().split("T")[0],
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          matchMinute: match.matchMinute,
          status: match.status,
          competition: (match as MatchState & { competition?: string }).competition,
          venue: (match as MatchState & { venue?: string }).venue,
          kickoffTime: (match as MatchState & { kickoffTime?: string }).kickoffTime,
        },
      })
    );
  }
}

/** Store standings in DynamoDB */
async function storeStandings(standings: StandingsEntry[]): Promise<void> {
  for (const entry of standings) {
    await docClient.send(
      new PutCommand({
        TableName: STANDINGS_TABLE,
        Item: entry,
      })
    );
  }
}

/** Store lineup data in DynamoDB */
async function storeLineup(matchId: string): Promise<void> {
  try {
    const lineup = await fetchMatchLineup(matchId);
    if (!lineup) return;

    await docClient.send(
      new PutCommand({
        TableName: LINEUPS_TABLE,
        Item: { matchId, teamSide: "home", ...lineup.homeTeam },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: LINEUPS_TABLE,
        Item: { matchId, teamSide: "away", ...lineup.awayTeam },
      })
    );
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "WARN",
        service: "match",
        message: "Failed to fetch lineup",
        metadata: { matchId, error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/** Main match data handler — triggered every minute during match windows */
export async function handler(): Promise<void> {
  console.log(
    JSON.stringify({ level: "INFO", service: "match", message: "Polling match data" })
  );

  try {
    // 1. Check for live match
    const currentState = await fetchArsenalMatchState();

    if (currentState) {
      // Get previous state from DynamoDB
      const matchDate = new Date().toISOString().split("T")[0];
      const prevResult = await docClient.send(
        new GetCommand({
          TableName: MATCHES_TABLE,
          Key: { matchId: currentState.matchId, matchDate },
        })
      );

      const previousState: MatchState = prevResult.Item
        ? { ...(prevResult.Item as unknown as MatchState), events: [] }
        : { ...currentState, events: [], homeScore: 0, awayScore: 0, matchMinute: 0 };

      // Detect and store new events
      const newEvents = detectNewEvents(previousState, currentState);
      if (newEvents.length > 0) {
        await storeMatchEvents(newEvents);

        const notifications = newEvents
          .map(eventToNotification)
          .filter((n): n is NotificationPayload => n !== null);

        for (const notification of notifications) {
          console.log(
            JSON.stringify({
              level: "INFO",
              service: "match",
              message: "Broadcasting notification",
              metadata: notification,
            })
          );
          // TODO: Invoke real-time Lambda to broadcast via WebSocket
        }
      }

      await updateMatchState(currentState);
      await storeLineup(currentState.matchId);
    }

    // 2. Update upcoming matches (less frequent — every poll is fine, API caches)
    const upcoming = await fetchUpcomingMatches(10);
    await storeUpcomingMatches(upcoming);

    // 3. Update standings
    const standings = await fetchStandings();
    await storeStandings(standings);

  } catch (error) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        service: "match",
        message: "Match data polling failed",
        metadata: { error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}
