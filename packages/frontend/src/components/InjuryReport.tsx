import React from "react";

interface PlayerInjury {
  player: string;
  position: string;
  injury: string;
  status: "Out" | "Doubtful" | "Return";
  expectedReturn: string;
}

const LAST_UPDATED = "2026-05-21";

const INJURIES: PlayerInjury[] = [
  { player: "Jurrien Timber", position: "Defender", injury: "Muscle injury", status: "Return", expectedReturn: "Available for Crystal Palace" },
  { player: "Mikel Merino", position: "Midfielder", injury: "Broken foot (surgery)", status: "Doubtful", expectedReturn: "Late May — monitor" },
  { player: "Martin Odegaard", position: "Midfielder", injury: "Knock", status: "Return", expectedReturn: "Available for Crystal Palace" },
  { player: "Kai Havertz", position: "Midfielder", injury: "Groin (muscular niggle)", status: "Return", expectedReturn: "Available for Crystal Palace" },
];

const STATUS_STYLES = {
  Out: { bg: "#EF0107", label: "Out" },
  Doubtful: { bg: "#9C824A", label: "Doubtful" },
  Return: { bg: "#2E8540", label: "Returning" },
};

export function InjuryReport() {
  const daysSinceUpdate = Math.floor((Date.now() - new Date(LAST_UPDATED).getTime()) / 86400000);
  const isOwner = localStorage.getItem("arsenal-owner") === "london49";
  const isStale = daysSinceUpdate > 3 && isOwner;

  return (
    <section style={{ marginTop: "2rem" }} aria-label="Injury report">
      <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Injury Report</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {INJURIES.map((inj) => {
          const s = STATUS_STYLES[inj.status];
          return (
            <div key={inj.player} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e3a5f", borderRadius: "8px", padding: "0.75rem 1rem", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.95rem" }}>{inj.player}</p>
                <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.8rem", color: "#9CA3AF" }}>{inj.position} · {inj.injury}</p>
                <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.78rem", color: "#64748B" }}>Expected return: {inj.expectedReturn}</p>
              </div>
              <span style={{ background: s.bg, color: "white", padding: "3px 12px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "bold", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "0.75rem", color: isStale ? "#EF0107" : "#6B7280", marginTop: "0.75rem" }}>
        {isStale
          ? `⚠️ Injury report is ${daysSinceUpdate} days old — update needed`
          : `Last updated: May 21, 2026 · Source: Arsenal FC, Daily Cannon`}
      </p>
    </section>
  );
}