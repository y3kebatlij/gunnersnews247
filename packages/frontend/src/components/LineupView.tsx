import React from "react";
import type { Lineup, LineupTeam } from "@arsenal/shared";

interface LineupViewProps {
  lineup: Lineup | null;
}

function TeamLineup({ team, side }: { team: LineupTeam; side: string }) {
  return (
    <div aria-label={`${side} team lineup: ${team.teamName}`}>
      <h4>{team.teamName} ({team.formation})</h4>
      <section aria-label="Starting eleven">
        <h5>Starting XI</h5>
        <ol className="usa-list">
          {team.startingEleven.map((player) => (
            <li key={player.number}>
              {player.number}. {player.name} ({player.position})
            </li>
          ))}
        </ol>
      </section>
      <section aria-label="Substitutes">
        <h5>Substitutes</h5>
        <ul className="usa-list">
          {team.substitutes.map((player) => (
            <li key={player.number}>
              {player.number}. {player.name} ({player.position})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function LineupView({ lineup }: LineupViewProps) {
  if (!lineup) {
    return <p>Lineups have not been announced.</p>;
  }

  return (
    <section aria-label="Match lineups">
      <h3 className="usa-heading">Lineups</h3>
      <div className="grid-row grid-gap">
        <div className="grid-col-6">
          <TeamLineup team={lineup.homeTeam} side="Home" />
        </div>
        <div className="grid-col-6">
          <TeamLineup team={lineup.awayTeam} side="Away" />
        </div>
      </div>
    </section>
  );
}
