const PROXY_URL = "https://arsenal-proxy.eyuelkt.workers.dev";
const ARSENAL_ID = 57;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

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

async function apiFetch(path: string): Promise<any> {
  const res = await fetch(`${PROXY_URL}${path}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export interface Match {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  venue: string;
  kickoffTime: string;
  status: string;
  result?: "W" | "D" | "L";
  matchMinute?: string;
}

export interface Standing {
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
  recentForm: string[];
}

export interface Scorer {
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  isArsenal: boolean;
}

export async function fetchArsenalFixtures(): Promise<Match[]> {
  const cached = getCached<Match[]>("fixtures");
  if (cached) return cached;
  const data = await apiFetch(`/teams/${ARSENAL_ID}/matches?status=SCHEDULED&limit=10`);
  const result = (data.matches ?? []).map((m: any) => ({
    matchId: String(m.id),
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    competition: m.competition.name,
    venue: m.venue ?? "TBC",
    kickoffTime: m.utcDate,
    status: m.status,
  }));
  setCache("fixtures", result);
  return result;
}

export async function fetchArsenalResults(): Promise<Match[]> {
  const cached = getCached<Match[]>("results");
  if (cached) return cached;
  const data = await apiFetch(`/teams/${ARSENAL_ID}/matches?status=FINISHED&limit=5`);
  const result = (data.matches ?? []).map((m: any) => {
    const isHome = m.homeTeam.id === ARSENAL_ID;
    const arsenalScore = isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away;
    const oppScore = isHome ? m.score?.fullTime?.away : m.score?.fullTime?.home;
    let matchResult: "W" | "D" | "L" = "D";
    if (arsenalScore != null && oppScore != null) {
      matchResult = arsenalScore > oppScore ? "W" : arsenalScore < oppScore ? "L" : "D";
    }
    return {
      matchId: String(m.id),
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? 0,
      competition: m.competition.name,
      venue: m.venue ?? "",
      kickoffTime: m.utcDate,
      status: m.status,
      result: matchResult,
    };
  });
  setCache("results", result);
  return result;
}

export async function fetchLiveMatch(): Promise<Match | null> {
  try {
    const data = await apiFetch(`/teams/${ARSENAL_ID}/matches?status=IN_PLAY,PAUSED`);
    const m = data.matches?.[0];
    if (!m) return null;
    return {
      matchId: String(m.id),
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? 0,
      competition: m.competition.name,
      venue: m.venue ?? "",
      kickoffTime: m.utcDate,
      status: m.status,
      matchMinute: m.minute ? String(m.minute) : undefined,
    };
  } catch { return null; }
}

export async function fetchPremierLeagueStandings(): Promise<Standing[]> {
  const cached = getCached<Standing[]>("standings");
  if (cached) return cached;
  const data = await apiFetch(`/competitions/PL/standings`);
  const table = data.standings?.find((s: any) => s.type === "TOTAL")?.table ?? [];
  const result = table.map((e: any) => ({
    position: e.position,
    teamName: e.team.name,
    matchesPlayed: e.playedGames,
    wins: e.won,
    draws: e.draw,
    losses: e.lost,
    goalsFor: e.goalsFor,
    goalsAgainst: e.goalsAgainst,
    goalDifference: e.goalDifference,
    points: e.points,
    recentForm: e.form ? e.form.split(",").map((r: string) => r.trim()).filter((r: string) => ["W","D","L"].includes(r)) : [],
  }));
  setCache("standings", result);
  return result;
}

export async function fetchTopScorers(): Promise<Scorer[]> {
  const cached = getCached<Scorer[]>("scorers");
  if (cached) return cached;
  const data = await apiFetch(`/competitions/PL/scorers?limit=20`);
  const result = (data.scorers ?? []).map((s: any) => ({
    playerName: s.player.name,
    teamName: s.team.name,
    goals: s.goals ?? 0,
    assists: s.assists ?? 0,
    matchesPlayed: s.playedMatches ?? 0,
    isArsenal: s.team.id === ARSENAL_ID,
  }));
  setCache("scorers", result);
  return result;
}
