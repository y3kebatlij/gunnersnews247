import React, { useEffect, useState } from "react";
import { fetchPremierLeagueStandings, fetchTopScorers, Standing, Scorer } from "../services/footballService";

export function StandingsTable() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.allSettled([fetchPremierLeagueStandings(), fetchTopScorers()])
      .then(([s, sc]) => {
        if (s.status === "fulfilled") setStandings(s.value);
        if (sc.status === "fulfilled") setScorers(sc.value);
        setLoading(false);
      });
  }, []);

  const displayed = showAll ? standings : standings.slice(0, 20);

  return (
    <section aria-label="League standings" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        Premier League Standings
      </h2>
      {loading && <p>Loading standings...</p>}
      {!loading && standings.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #EF0107" }}>
                {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: h === "Team" ? "left" : "center", color: "#9CA3AF", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((entry, i) => {
                const isArsenal = entry.teamName.includes("Arsenal");
                return (
                  <tr key={entry.position} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: isArsenal ? "rgba(239,1,7,0.1)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.2s" }}>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", color: "#9CA3AF", fontWeight: "600" }}>{entry.position}</td>
                    <td style={{ padding: "0.6rem 0.75rem", fontWeight: isArsenal ? "800" : "500", color: isArsenal ? "#EF0107" : "inherit" }}>
                      {entry.teamName.replace(" FC", "").replace(" United", " Utd")}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.matchesPlayed}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.wins}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.draws}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.losses}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.goalsFor}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{entry.goalsAgainst}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", color: entry.goalDifference > 0 ? "#2E8540" : entry.goalDifference < 0 ? "#EF0107" : "inherit" }}>{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</td>
                    <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: "800", color: isArsenal ? "#EF0107" : "inherit" }}>{entry.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: "1.4rem", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", margin: "2rem 0 1.5rem 0" }}>
        Top Scorers
      </h2>
      {!loading && scorers.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #EF0107" }}>
                {["#", "Player", "Team", "Apps", "Goals", "Assists"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: h === "Player" || h === "Team" ? "left" : "center", color: "#9CA3AF", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scorers.slice(0, 10).map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: s.isArsenal ? "rgba(239,1,7,0.1)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", color: "#9CA3AF", fontWeight: "600" }}>{i + 1}</td>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: s.isArsenal ? "800" : "500", color: s.isArsenal ? "#EF0107" : "inherit" }}>{s.playerName}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "#9CA3AF" }}>{s.teamName.replace(" FC", "")}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{s.matchesPlayed}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontWeight: "800", color: s.isArsenal ? "#EF0107" : "inherit" }}>{s.goals}</td>
                  <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>{s.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}