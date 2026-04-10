import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface ScheduleMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  kickoffTime: string;
  status: string;
}

function isWithin24Hours(kickoffTime: string): boolean {
  const kickoff = new Date(kickoffTime).getTime();
  const now = Date.now();
  return kickoff - now > 0 && kickoff - now <= 24 * 60 * 60 * 1000;
}

export function ScheduleView() {
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`${API_URL}/schedule`);
        if (!response.ok) throw new Error("Failed to fetch schedule");
        const data = await response.json();
        setMatches(data.matches ?? []);
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <section aria-label="Upcoming matches">
      <h2 className="usa-heading">Upcoming Matches</h2>
      {loading && <p>Loading...</p>}
      {!loading && matches.length === 0 && <p>No upcoming matches scheduled.</p>}
      {matches.length > 0 && (
        <table className="usa-table usa-table--borderless" aria-label="Match schedule">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Kickoff</th>
              <th scope="col">Opponent</th>
              <th scope="col">Competition</th>
              <th scope="col">Venue</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const kickoff = new Date(match.kickoffTime);
              const highlight = isWithin24Hours(match.kickoffTime);
              const opponent = match.homeTeam === "Arsenal" ? match.awayTeam : match.homeTeam;
              const homeAway = match.homeTeam === "Arsenal" ? "(H)" : "(A)";

              return (
                <tr
                  key={match.matchId}
                  className={highlight ? "bg-gold-lighter" : ""}
                  aria-label={highlight ? "Match within 24 hours" : undefined}
                >
                  <td>{kickoff.toLocaleDateString()}</td>
                  <td>{kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{opponent} {homeAway}</td>
                  <td>{match.competition}</td>
                  <td>{match.venue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
