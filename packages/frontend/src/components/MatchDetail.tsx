import React, { useEffect, useState } from "react";
import type { MatchState, MatchEvent, Lineup } from "@arsenal/shared";
import { LineupView } from "./LineupView";
import { MatchTimeline } from "./MatchTimeline";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface MatchDetailProps {
  matchId: string;
}

export function MatchDetail({ matchId }: MatchDetailProps) {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [matchRes, lineupRes, timelineRes] = await Promise.all([
          fetch(`${API_URL}/match/${matchId}`),
          fetch(`${API_URL}/match/${matchId}/lineup`),
          fetch(`${API_URL}/match/${matchId}/timeline`),
        ]);

        if (matchRes.ok) setMatch(await matchRes.json());
        if (lineupRes.ok) {
          const data = await lineupRes.json();
          const lineups = data.lineups ?? [];
          if (lineups.length >= 2) {
            setLineup({
              matchId,
              homeTeam: lineups.find((l: { teamSide: string }) => l.teamSide === "home") ?? lineups[0],
              awayTeam: lineups.find((l: { teamSide: string }) => l.teamSide === "away") ?? lineups[1],
            });
          }
        }
        if (timelineRes.ok) {
          const data = await timelineRes.json();
          setEvents(data.events ?? []);
        }
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId]);

  if (loading) return <p>Loading match details...</p>;
  if (!match) return <p>Match not found.</p>;

  return (
    <section aria-label="Match details">
      <h2 className="usa-heading">
        {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
      </h2>
      <LineupView lineup={lineup} />
      <MatchTimeline events={events} />
    </section>
  );
}
