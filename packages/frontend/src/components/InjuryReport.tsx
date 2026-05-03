import React from "react";

interface PlayerInjury {
  player: string;
  injury: string;
  status: "Out" | "Doubtful" | "Return";
  expectedReturn: string;
}

const KNOWN_INJURIES: PlayerInjury[] = [
  { player: "Takehiro Tomiyasu", injury: "Knee", status: "Out", expectedReturn: "Unknown" },
  { player: "Gabriel Jesus", injury: "Knee", status: "Out", expectedReturn: "End of season" },
];

const STATUS_COLORS = { Out: "#EF0107", Doubtful: "#9C824A", Return: "#2E8540" };
const STATUS_LABELS = { Out: "Out", Doubtful: "Doubtful", Return: "Returning" };

export function InjuryReport() {
  return (
    <section style={{ marginTop: "2rem" }} aria-label="Injury report">
      <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Injury Report</h3>
      {KNOWN_INJURIES.length === 0 ? (
        <p style={{ color: "#9CA3AF" }}>No current injuries. Full squad available!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {KNOWN_INJURIES.map((inj) => (
            <div key={inj.player} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e3a5f", borderRadius: "8px", padding: "0.75rem 1rem" }}>
              <div>
                <strong style={{ fontSize: "0.95rem" }}>{inj.player}</strong>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.82rem", color: "#9CA3AF" }}>{inj.injury} — Expected return: {inj.expectedReturn}</p>
              </div>
              <span style={{ background: STATUS_COLORS[inj.status], color: "white", padding: "3px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {STATUS_LABELS[inj.status]}
              </span>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.75rem" }}>Source: Arsenal FC Official</p>
    </section>
  );
}