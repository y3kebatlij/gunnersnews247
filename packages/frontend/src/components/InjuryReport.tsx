import React from "react";

interface PlayerInjury {
  player: string;
  position: string;
  injury: string;
  status: "Out" | "Doubtful" | "Return";
  expectedReturn: string;
}

const INJURIES: PlayerInjury[] = [
  { player: "Jurrien Timber", position: "Defender", injury: "Muscle injury", status: "Doubtful", expectedReturn: "vs PSG Champions League Final" },
  { player: "Mikel Merino", position: "Midfielder", injury: "Broken foot (surgery)", status: "Doubtful", expectedReturn: "vs PSG Champions League Final" },
  { player: "Martin Odegaard", position: "Midfielder", injury: "Knock", status: "Return", expectedReturn: "Expected back vs West Ham" },
  { player: "Kai Havertz", position: "Midfielder", injury: "Groin (muscular niggle)", status: "Return", expectedReturn: "Expected back vs West Ham" },
];

const STATUS_STYLES = {
  Out: { bg: "#EF0107", label: "Out" },
  Doubtful: { bg: "#9C824A", label: "Doubtful" },
  Return: { bg: "#2E8540", label: "Returning" },
};

export function InjuryReport() {
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
      <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.75rem" }}>Last updated: May 10, 2026 · Source: Arsenal FC, Daily Cannon</p>
    </section>
  );
}