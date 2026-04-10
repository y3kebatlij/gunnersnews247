/**
 * Client for football-data.org API (free tier).
 * Provides live scores, lineups, standings, and schedules for Arsenal.
 * Requires API key set in FOOTBALL_DATA_API_KEY env var.
 * Free tier: 10 requests/minute.
 */

import type {
  MatchState,
  MatchEvent,
  MatchEventType,
  Lineup,
  LineupTeam,
  Player,
  StandingsEntry,
} from "@arsenal/shared";

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const ARSENAL_TEAM_ID = 57; // Arsenal's ID in football-data.org
const PREMIER_LEAGUE_ID = 2021;

interface FetchOptions {
  path: string;
}

async function apiGet<T>(opts: FetchOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${opts.path}`, {
    headers: {
      "X-Auth-Token": API_KEY,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`football-data.org API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// --- API Response Types ---

interface FDMatch {
  id: number;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED";
  matchday: number;
  utcDate: string;
  minute?: number;
  homeTeam: { id: number; name: string; shortName: string };
  awayTeam: { id: number; name: string; shortName: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: { name: string };
  venue?: string;
  goals?: FDGoal[];
  substitutions?: FDSubstitution[];
  bookings?: FDBooking[];
  lineups?: FDLineup[];
}

interface FDGoal {
  minute: number;
  team: { id: number; name: string };
  scorer: { name: string };
  assist?: { name: string } | null;
  type: "REGULAR" | "OWN" | "PENALTY";
}

interface FDSubstitution {
  minute: number;
  team: { id: number; name: string };
  playerIn: { name: string };
  playerOut: { name: string };
}

interface FDBooking {
  minute: number;
  team: { id: number; name: string };
  player: { name: string };
  card: "YELLOW_CARD" | "YELLOW_RED" | "RED_CARD";
}

interface FDLineup {
  team: { id: number; name: string };
  formation: string;
  lineup: { name: string; shirtNumber: number; position: string }[];
  bench: { name: string; shirtNumber: number; position: string }[];
}

interface FDStandingRow {
  position: number;
  team: { id: number; name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null; // "W,W,D,L,W"
}

// --- Public API ---

/** Map football-data.org match status to our MatchState status */
function mapStatus(fdStatus: string): "scheduled" | "live" | "halftime" | "finished" {
  switch (fdStatus) {
    case "IN_PLAY": return "live";
    case "PAUSED": return "halftime";
    case "FINISHED": return "finished";
    default: return "scheduled";
  }
}

/** Convert football-data.org match events into our MatchEvent format */
function extractEvents(match: FDMatch): MatchEvent[] {
  const events: MatchEvent[] = [];
  let eventCounter = 0;

  // Goals
  for (const goal of match.goals ?? []) {
    const type: MatchEventType = goal.type === "OWN" ? "own_goal" : "goal";
    events.push({
      eventId: `${match.id}-evt-${eventCounter++}`,
      matchId: String(match.id),
      type,
      minute: goal.minute,
      playerName: goal.scorer.name,
      teamName: goal.team.name,
      detail: goal.assist?.name ? `Assist: ${goal.assist.name}` : undefined,
    });
  }

  // Substitutions
  for (const sub of match.substitutions ?? []) {
    events.push({
      eventId: `${match.id}-evt-${eventCounter++}`,
      matchId: String(match.id),
      type: "substitution",
      minute: sub.minute,
      playerName: sub.playerIn.name,
      teamName: sub.team.name,
      detail: `Replaces ${sub.playerOut.name}`,
    });
  }

  // Bookings
  for (const booking of match.bookings ?? []) {
    const type: MatchEventType = booking.card === "RED_CARD" || booking.card === "YELLOW_RED"
      ? "red_card"
      : "yellow_card";
    events.push({
      eventId: `${match.id}-evt-${eventCounter++}`,
      matchId: String(match.id),
      type,
      minute: booking.minute,
      playerName: booking.player.name,
      teamName: booking.team.name,
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

/** Fetch current/recent Arsenal match state */
export async function fetchArsenalMatchState(): Promise<MatchState | null> {
  const data = await apiGet<{ matches: FDMatch[] }>({
    path: `/teams/${ARSENAL_TEAM_ID}/matches?status=LIVE,IN_PLAY,PAUSED,FINISHED&limit=1`,
  });

  const match = data.matches?.[0];
  if (!match) return null;

  // Only return live/halftime matches
  if (match.status !== "IN_PLAY" && match.status !== "PAUSED") return null;

  return {
    matchId: String(match.id),
    homeTeam: match.homeTeam.shortName ?? match.homeTeam.name,
    awayTeam: match.awayTeam.shortName ?? match.awayTeam.name,
    homeScore: match.score.fullTime.home ?? 0,
    awayScore: match.score.fullTime.away ?? 0,
    matchMinute: match.minute ?? 0,
    status: mapStatus(match.status),
    events: extractEvents(match),
  };
}

/** Fetch upcoming Arsenal matches for the schedule view */
export async function fetchUpcomingMatches(limit: number = 10): Promise<MatchState[]> {
  const data = await apiGet<{ matches: FDMatch[] }>({
    path: `/teams/${ARSENAL_TEAM_ID}/matches?status=SCHEDULED,TIMED&limit=${limit}`,
  });

  return (data.matches ?? []).map((match) => ({
    matchId: String(match.id),
    homeTeam: match.homeTeam.shortName ?? match.homeTeam.name,
    awayTeam: match.awayTeam.shortName ?? match.awayTeam.name,
    homeScore: 0,
    awayScore: 0,
    matchMinute: 0,
    status: "scheduled" as const,
    events: [],
    competition: match.competition.name,
    venue: match.venue ?? "TBD",
    kickoffTime: match.utcDate,
  }));
}

/** Fetch match lineups */
export async function fetchMatchLineup(matchId: string): Promise<Lineup | null> {
  const data = await apiGet<FDMatch>({
    path: `/matches/${matchId}`,
  });

  if (!data.lineups || data.lineups.length < 2) return null;

  const mapTeam = (fdLineup: FDLineup): LineupTeam => ({
    teamName: fdLineup.team.name,
    formation: fdLineup.formation ?? "Unknown",
    startingEleven: fdLineup.lineup.map((p): Player => ({
      name: p.name,
      number: p.shirtNumber,
      position: p.position,
    })),
    substitutes: fdLineup.bench.map((p): Player => ({
      name: p.name,
      number: p.shirtNumber,
      position: p.position,
    })),
  });

  return {
    matchId,
    homeTeam: mapTeam(data.lineups[0]),
    awayTeam: mapTeam(data.lineups[1]),
  };
}

/** Fetch Premier League standings */
export async function fetchStandings(competitionId: number = PREMIER_LEAGUE_ID): Promise<StandingsEntry[]> {
  const data = await apiGet<{
    competition: { name: string };
    standings: { table: FDStandingRow[] }[];
  }>({
    path: `/competitions/${competitionId}/standings`,
  });

  const table = data.standings?.[0]?.table ?? [];
  const competitionName = data.competition?.name ?? "Premier League";

  return table.map((row): StandingsEntry => ({
    competition: competitionName,
    position: row.position,
    teamName: row.team.name,
    matchesPlayed: row.playedGames,
    wins: row.won,
    draws: row.draw,
    losses: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    recentForm: row.form ? row.form.split(",").slice(0, 5) : [],
  }));
}
