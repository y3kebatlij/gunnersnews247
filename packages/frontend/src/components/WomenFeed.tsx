import React, { useEffect, useState, useCallback } from "react";
import { fetchArsenalNews, ContentItem } from "../services/newsService";

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function WomenFeed() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const PAGE_SIZE = 10;

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchArsenalNews("women");
      setItems(data);
      setLoading(false);
    } catch {
      setError("Unable to load Arsenal Women content.");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const trimmed = searchTerm.trim().toLowerCase();
  const filtered = trimmed.length < 2 ? items : items.filter(i =>
    (i.title + i.summary + i.sourceName).toLowerCase().includes(trimmed)
  );
  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  return (
    <section aria-label="Arsenal Women" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1b4e)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", borderLeft: "4px solid #a855f7" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "700", color: "#e879f9" }}>Arsenal Women</h2>
        <p style={{ margin: "0.4rem 0 0 0", color: "#c084fc", fontSize: "0.88rem" }}>
          Latest news, match reports, transfers and analysis for Arsenal Women FC
        </p>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
        placeholder="Search Arsenal Women articles..."
        style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.05)", color: "inherit", fontSize: "0.9rem", marginBottom: "1.25rem", boxSizing: "border-box" }}
      />

      {loading && <p style={{ color: "#9CA3AF" }}>Loading Arsenal Women content...</p>}
      {error && <p style={{ color: "#EF0107" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
          <p style={{ fontSize: "2rem" }}>⚽</p>
          <p>No Arsenal Women articles found yet. Check back soon!</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginBottom: "1rem" }}>
          Showing {displayed.length} of {filtered.length} articles
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {displayed.map((item) => (
          <div key={item.contentId} style={{ background: "rgba(168,85,247,0.05)", borderRadius: "10px", padding: "1rem 1.25rem", borderLeft: "3px solid #a855f7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(168,85,247,0.2)", color: "#e879f9", padding: "2px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "600", letterSpacing: "0.04em" }}>
                {item.contentType === "women" ? "Women" : item.contentType}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                {item.sourceName} · {item.sourceCountry} · {item.publicationDate ? timeAgo(item.publicationDate) : ""}
              </span>
            </div>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600", fontSize: "0.95rem", color: "#c084fc", textDecoration: "none", display: "block", marginBottom: "0.4rem", lineHeight: "1.4" }}>
              {item.title}
            </a>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "#9CA3AF", lineHeight: "1.5" }}>{item.summary}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => setPage(page + 1)} type="button" style={{ padding: "0.6rem 2rem", background: "rgba(168,85,247,0.2)", color: "#e879f9", border: "2px solid #a855f7", borderRadius: "20px", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>
            Load more ({filtered.length - displayed.length} remaining)
          </button>
        </div>
      )}
    </section>
  );
}