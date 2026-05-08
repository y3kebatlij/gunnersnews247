import React, { useEffect, useState } from "react";
import { fetchArsenalFixtures, fetchArsenalResults, Match } from "../services/footballService";

function isLive(kickoffTime: string): boolean {
  const kickoff = new Date(kickoffTime).getTime();
  const now = Date.now();
  return now > kickoff && now < kickoff + 120 * 60 * 1000;
}

function isToday(kickoffTime: string): boolean {
  const d = new Date(kickoffTime);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

export function Scoreboard() {
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [lastResult, setLastResult] = useState<Match | null>(null);
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.allSettled([fetchArsenalFixtures(), fetchArsenalResults()])
      .then(([fix, res]) => {
        if (fix.status === "fulfilled" && fix.value.length > 0) setNextMatch(fix.value[0]);
        if (res.status === "fulfilled" && res.value.length > 0) setLastResult(res.value[res.value.length - 1]);
      });
  }, [tick]);

  useEffect(() => {
    if (nextMatch && isLive(nextMatch.kickoffTime)) {
      setLive(true);
      const interval = setInterval(() => setTick(t => t + 1), 60000);
      return () => clearInterval(interval);
    }
    setLive(false);
  }, [nextMatch]);

  const matchDay = nextMatch && isToday(nextMatch.kickoffTime);

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      {live && nextMatch && (
        <div style={{ flex: "1 1 100%", background: "linear-gradient(135deg, #7f1d1d, #EF0107)", borderRadius: "10px", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "10px", height: "10px", background: "#fff", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" }} />
            <span style={{ fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>LIVE</span>
            <span style={{ fontSize: "0.85rem" }}>{nextMatch.competition.replace("UEFA ", "")}</span>
          </div>
          <div style={{ fontWeight: "800", fontSize: "1.2rem", letterSpacing: "0.05em" }}>
            {nextMatch.homeTeam.includes("Arsenal") ? "Arsenal" : nextMatch.homeTeam.replace(" FC", "")}
            {" — "}
            {nextMatch.homeTeam.includes("Arsenal") ? nextMatch.awayTeam.replace(" FC", "") : "Arsenal"}
          </div>
          <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>Auto-refreshing every minute</span>
        </div>
      )}
      {matchDay && !live && nextMatch && (
        <div style={{ flex: "1 1 100%", background: "linear-gradient(135deg, #1a3a1a, #2E8540)", borderRadius: "10px", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Match Day! ⚽</span>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
              Arsenal {nextMatch.homeTeam.includes("Arsenal") ? "vs" : "@"} {(nextMatch.homeTeam.includes("Arsenal") ? nextMatch.awayTeam : nextMatch.homeTeam).replace(" FC", "")}
            </p>
          </div>
          <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>
            {new Date(nextMatch.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
      {lastResult && (
        <div style={{ flex: "1", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "0.6rem 1rem", minWidth: "140px" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Last Result</p>
          <p style={{ margin: "0.2rem 0 0 0", fontWeight: "700", fontSize: "0.9rem" }}>
            {lastResult.homeTeam.includes("Arsenal") ? "Arsenal" : lastResult.homeTeam.replace(" FC", "")} {lastResult.homeScore} - {lastResult.awayScore} {lastResult.homeTeam.includes("Arsenal") ? lastResult.awayTeam.replace(" FC", "") : "Arsenal"}
          </p>
          <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.72rem", color: "#9CA3AF" }}>{lastResult.competition.replace("UEFA ", "").replace("Premier League", "PL")}</p>
        </div>
      )}
      {nextMatch && !matchDay && (
        <div style={{ flex: "1", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "0.6rem 1rem", minWidth: "140px" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Next Match</p>
          <p style={{ margin: "0.2rem 0 0 0", fontWeight: "700", fontSize: "0.9rem" }}>
            Arsenal {nextMatch.homeTeam.includes("Arsenal") ? "vs" : "@"} {(nextMatch.homeTeam.includes("Arsenal") ? nextMatch.awayTeam : nextMatch.homeTeam).replace(" FC", "")}
          </p>
          <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.72rem", color: "#9CA3AF" }}>
            {new Date(nextMatch.kickoffTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date(nextMatch.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}