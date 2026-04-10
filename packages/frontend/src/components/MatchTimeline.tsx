import React from "react";
import type { MatchEvent, MatchEventType } from "@arsenal/shared";

interface MatchTimelineProps {
  events: MatchEvent[];
}

const EVENT_ICONS: Record<MatchEventType, string> = {
  goal: "⚽",
  own_goal: "⚽ (OG)",
  substitution: "🔄",
  yellow_card: "🟨",
  red_card: "🟥",
  penalty_awarded: "P",
  penalty_missed: "P ✗",
};

export function MatchTimeline({ events }: MatchTimelineProps) {
  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  if (sorted.length === 0) {
    return <p>No match events yet.</p>;
  }

  return (
    <section aria-label="Match timeline">
      <h3 className="usa-heading">Match Timeline</h3>
      <ol className="usa-list usa-list--unstyled" aria-label="Match events in chronological order">
        {sorted.map((event) => (
          <li
            key={event.eventId}
            style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}
            aria-label={`${event.minute}' - ${event.type}: ${event.playerName} (${event.teamName})`}
          >
            <span style={{ fontWeight: "bold", minWidth: "3em", display: "inline-block" }}>
              {event.minute}'
            </span>
            <span style={{ marginRight: "0.5em" }}>{EVENT_ICONS[event.type]}</span>
            <span>{event.playerName}</span>
            <span className="text-base-dark"> ({event.teamName})</span>
            {event.detail && <span className="text-base-dark"> — {event.detail}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
