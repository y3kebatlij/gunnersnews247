import React, { useEffect, useState } from "react";
import { fetchArsenalTransfers, TransferItem } from "../services/newsService";

const ALL_TYPES = [
  { value: "", label: "All" },
  { value: "rumor", label: "Rumors" },
  { value: "confirmed_signing", label: "Confirmed" },
  { value: "loan", label: "Loans" },
  { value: "contract_extension", label: "Extensions" },
  { value: "departure", label: "Departures" },
];

const TYPE_COLORS: Record<string, string> = {
  rumor: "#9C824A",
  confirmed_signing: "#2E8540",
  loan: "#1e3a8a",
  contract_extension: "#5b21b6",
  departure: "#EF0107",
};

function transferLabel(type: string): string {
  const labels: Record<string, string> = {
    rumor: "Rumor",
    confirmed_signing: "Confirmed",
    loan: "Loan",
    contract_extension: "Extension",
    departure: "Departure",
  };
  return labels[type] ?? type;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TransferFeed() {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArsenalTransfers()
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setError("Unable to load transfer news."); setLoading(false); });
  }, []);

  const displayed = filter ? items.filter(i => i.transferType === filter) : items;

  return (
    <section aria-label="Transfer news">
      <h2 className="usa-heading">Transfer News</h2>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {ALL_TYPES.map(({ value, label }) => (
          <button key={value} className={`filter-chip ${filter === value ? "filter-chip--active" : ""}`} onClick={() => setFilter(value)} aria-pressed={filter === value} type="button">{label}</button>
        ))}
      </div>
      {loading && <p>Loading transfer news...</p>}
      {error && <p style={{ color: "#EF0107" }}>{error}</p>}
      {!loading && !error && displayed.length === 0 && (
        <p style={{ color: "#9CA3AF" }}>{filter ? `No ${filter.replace("_", " ")} transfers found.` : "No transfer activity found. Check back soon."}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {displayed.map((item) => (
          <div key={item.contentId} style={{ background: "#1e3a5f", borderRadius: "8px", padding: "1rem 1.25rem", borderLeft: `4px solid ${TYPE_COLORS[item.transferType] ?? "#EF0107"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ background: TYPE_COLORS[item.transferType] ?? "#EF0107", color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "bold" }}>{transferLabel(item.transferType)}</span>
              <span style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{item.sourceName} · {timeAgo(item.publicationDate)}</span>
            </div>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="usa-link" style={{ fontWeight: "bold", fontSize: "1rem", display: "block", marginBottom: "0.4rem" }}>{item.title}</a>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#CBD5E1", lineHeight: "1.5" }}>{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}