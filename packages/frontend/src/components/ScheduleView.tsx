import React, { useEffect, useState } from "react";
import { fetchArsenalFixtures, fetchArsenalResults, Match } from "../services/footballService";
import { InjuryReport } from "./InjuryReport";

const RESULT_COLORS = {
  W: { bg: "#2E8540", label: "W" },
  D: { bg: "#9C824A", label: "D" },
  L: { bg: "#EF0107", label: "L" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isWithin24Hours(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

export function ScheduleView() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchArsenalFixtures(), fetchArsenalResults()])
      .then(([fix, res]) => {
        if (fix.status === "fulfilled") setFixtures(fix.value);
        if (res.status === "fulfilled") setResults(res.value);
        setLoading(false);
      });
  }, []);

  return (
    <section aria-label="Schedule and results">
      <h2 className="usa-heading">Schedule & Results</h2>

      {results.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Recent Results</h3>
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {results.map((r) => {
              const resultKey = r.result as "W" | "D" | "L" | undefined;
              const resultStyle = resultKey ? RESULT_COLORS[resultKey] : RESULT_COLORS.D;
              const isHome = r.homeTeam.includes("Arsenal");
              const opponent = isHome ? r.awayTeam : r.homeTeam;
              return (
                <div key={r.matchId} style={{ minWidth: "160px", background: "#1e3a5f", borderRadius: "8px", padding: "0.75rem", textAlign: "center", flexShrink: 0 }}>
                  <span style={{ background: resultStyle.bg, color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold", display: "inline-block", marginBottom: "0.4rem" }}>{resultStyle.label}</span>
                  <p style={{ margin: "0 0 0.25rem 0", fontWeight: "bold", fontSize: "0.9rem" }}>{opponent.replace(" FC", "").replace(" United", " Utd")}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#EF0107" }}>{r.homeScore} - {r.awayScore}</p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#9CA3AF" }}>{r.competition.replace("UEFA ", "").replace("Premier League", "PL")}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Upcoming Matches</h3>
        {loading && <p>Loading fixtures...</p>}
        {!loading && fixtures.length === 0 && <p style={{ color: "#9CA3AF" }}>No upcoming matches scheduled.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {fixtures.map((match) => {
            const isHome = match.homeTeam.includes("Arsenal");
            const opponent = isHome ? match.awayTeam : match.homeTeam;
            const highlight = isWithin24Hours(match.kickoffTime);
            return (
              <div key={match.matchId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: highlight ? "#3b1f00" : "#1e3a5f", borderRadius: "8px", padding: "0.85rem 1.25rem", borderLeft: highlight ? "4px solid #F59E0B" : "4px solid #EF0107", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem" }}>Arsenal {isHome ? "vs" : "@"} {opponent.replace(" FC", "").replace(" United", " Utd")} <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>({isHome ? "Home" : "Away"})</span></p>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.82rem", color: "#9CA3AF" }}>{match.competition.replace("UEFA ", "")}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: highlight ? "#F59E0B" : "inherit" }}>{formatDate(match.kickoffTime)}</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#9CA3AF" }}>{formatTime(match.kickoffTime)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InjuryReport />
    </section>
  );
}