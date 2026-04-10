import React, { useEffect, useState } from "react";
import type { StandingsEntry } from "@arsenal/shared";
import { FORM_RESULTS_COUNT } from "@arsenal/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const COMPETITIONS = ["Premier League", "Champions League", "FA Cup", "League Cup"];

function FormIndicator({ form }: { form: string[] }) {
  const display = form.slice(0, FORM_RESULTS_COUNT);
  return (
    <span aria-label={`Recent form: ${display.join(", ")}`}>
      {display.map((result, i) => {
        const color = result === "W" ? "green" : result === "D" ? "gold" : "red";
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "1.2em",
              height: "1.2em",
              lineHeight: "1.2em",
              textAlign: "center",
              borderRadius: "2px",
              backgroundColor: color,
              color: "white",
              fontSize: "0.75em",
              marginRight: "2px",
              fontWeight: "bold",
            }}
          >
            {result}
          </span>
        );
      })}
    </span>
  );
}

export function StandingsTable() {
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [competition, setCompetition] = useState("Premier League");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/standings?competition=${encodeURIComponent(competition)}`);
        if (!response.ok) throw new Error("Failed to fetch standings");
        const data = await response.json();
        setStandings(data.standings ?? []);
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [competition]);

  return (
    <section aria-label="League standings">
      <h2 className="usa-heading">Standings</h2>
      <label className="usa-label" htmlFor="competition-select">Competition</label>
      <select
        className="usa-select"
        id="competition-select"
        value={competition}
        onChange={(e) => setCompetition(e.target.value)}
      >
        {COMPETITIONS.map((comp) => (
          <option key={comp} value={comp}>{comp}</option>
        ))}
      </select>

      {loading && <p>Loading...</p>}
      {!loading && standings.length === 0 && <p>No standings available.</p>}
      {standings.length > 0 && (
        <table className="usa-table" aria-label={`${competition} standings`}>
          <thead>
            <tr>
              <th scope="col">Pos</th>
              <th scope="col">Team</th>
              <th scope="col">P</th>
              <th scope="col">W</th>
              <th scope="col">D</th>
              <th scope="col">L</th>
              <th scope="col">GF</th>
              <th scope="col">GA</th>
              <th scope="col">GD</th>
              <th scope="col">Pts</th>
              <th scope="col">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry) => (
              <tr
                key={`${entry.competition}-${entry.position}`}
                className={entry.teamName === "Arsenal" ? "bg-red-warm-10v" : ""}
                aria-label={entry.teamName === "Arsenal" ? "Arsenal (highlighted)" : undefined}
              >
                <td>{entry.position}</td>
                <td style={{ fontWeight: entry.teamName === "Arsenal" ? "bold" : "normal" }}>
                  {entry.teamName}
                </td>
                <td>{entry.matchesPlayed}</td>
                <td>{entry.wins}</td>
                <td>{entry.draws}</td>
                <td>{entry.losses}</td>
                <td>{entry.goalsFor}</td>
                <td>{entry.goalsAgainst}</td>
                <td>{entry.goalDifference}</td>
                <td style={{ fontWeight: "bold" }}>{entry.points}</td>
                <td><FormIndicator form={entry.recentForm} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
