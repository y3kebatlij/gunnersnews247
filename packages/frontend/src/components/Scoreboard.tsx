import React, { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { MatchState } from "@arsenal/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function Scoreboard() {
  const [match, setMatch] = useState<MatchState | null>(null);
  const { connected } = useWebSocket();
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    setConnectionLost(!connected && match !== null);
  }, [connected, match]);

  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/schedule`);
        if (!response.ok) return;
        const data = await response.json();
        const liveMatch = (data.matches ?? []).find(
          (m: MatchState) => m.status === "live" || m.status === "halftime"
        );
        setMatch(liveMatch ?? null);
      } catch {
        // Silently fail — will retry
      }
    };

    poll();
    const interval = setInterval(poll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!match) return null;

  return (
    <section
      className="usa-alert usa-alert--info"
      aria-label="Live scoreboard"
      aria-live="polite"
      role="region"
    >
      <div className="usa-alert__body" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span className="usa-tag bg-red">LIVE</span>
        <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>
          {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
        </span>
        <span className="text-base-dark">{match.matchMinute}'</span>
        {connectionLost && (
          <span className="usa-tag bg-gold" aria-label="Connection lost">
            Connection lost
          </span>
        )}
      </div>
    </section>
  );
}
