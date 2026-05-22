import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchArsenalNews, ContentItem } from "../services/newsService";
import { BookmarkButton } from "./BookmarkButton";

const FILTERS = [
  { label: "All", value: "" },
  { label: "News", value: "news" },
  { label: "Blog", value: "blog" },
  { label: "Podcast", value: "podcast" },
  { label: "Video", value: "video" },
];

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getReadArticles(): Set<string> {
  try {
    const stored = localStorage.getItem("arsenal-read");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function markAsRead(contentId: string): void {
  try {
    const read = getReadArticles();
    read.add(contentId);
    const arr = [...read].slice(-500);
    localStorage.setItem("arsenal-read", JSON.stringify(arr));
  } catch {}
}

export function ContentFeed({ contentType: initialType }: { contentType?: string } = {}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [contentType, setContentType] = useState(initialType ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  useEffect(() => { setReadIds(getReadArticles()); }, []);

  const load = useCallback(async (type: string) => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const data = await fetchArsenalNews(type || undefined);
      setItems(data);
    } catch {
      setError("Unable to load articles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(contentType); }, [contentType, load]);

  const handleFilter = (value: string) => {
    if (value === "video") { navigate("/video"); return; }
    setContentType(value);
    setSearchTerm("");
  };

  const handleArticleClick = (contentId: string) => {
    markAsRead(contentId);
    setReadIds(getReadArticles());
  };

  const trimmed = searchTerm.trim().toLowerCase();
  const filtered = trimmed.length < 2 ? items : items.filter(i =>
    (i.title + i.summary + i.sourceName).toLowerCase().includes(trimmed)
  );
  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  return (
    <section aria-label="Arsenal news feed" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1b2a, #1e3a5f)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: "700" }}>Your Daily Arsenal Fix</h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#9CA3AF" }}>
          News, transfers, podcasts, and blogs from {items.length > 0 ? items.length : "25"}+ articles worldwide.
        </p>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#2E8540", fontWeight: "600" }}>Updated just now</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }} role="group" aria-label="Content type filter">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            type="button"
            aria-pressed={contentType === value}
            style={{ padding: "0.35rem 1rem", borderRadius: "20px", border: `2px solid ${contentType === value ? "#EF0107" : "rgba(255,255,255,0.2)"}`, background: contentType === value ? "#EF0107" : "transparent", color: contentType === value ? "white" : "inherit", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="search-input" style={{ display: "block", fontSize: "0.8rem", color: "#9CA3AF", marginBottom: "0.3rem" }}>Search</label>
        <input
          id="search-input"
          type="text"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Search articles, podcasts, blogs..."
          style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", fontSize: "0.88rem", boxSizing: "border-box" }}
        />
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginBottom: "0.75rem" }}>
          Showing {displayed.length} of {filtered.length} articles
        </p>
      )}

      {loading && <p style={{ color: "#9CA3AF" }}>Loading Arsenal news...</p>}
      {error && <p style={{ color: "#EF0107" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: "#9CA3AF" }}>No content available.</p>
      )}

      <div className="usa-card-group" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {displayed.map((item) => {
          const isRead = readIds.has(item.contentId);
          return (
            <div
              key={item.contentId}
              className="usa-card__container"
              style={{
                borderRadius: "10px",
                background: isRead ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isRead ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)"}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                opacity: isRead ? 0.6 : 1,
                transition: "opacity 0.2s",
                position: "relative",
              }}
            >
              {isRead && (
                <div style={{ position: "absolute", top: "8px", right: "8px", background: "#2E8540", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "700", zIndex: 1 }}>✓</div>
              )}
              <div className="usa-card__body" style={{ padding: "0.85rem 1rem", flex: 1 }}>
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", background: "rgba(239,1,7,0.15)", color: "#EF0107", padding: "1px 8px", borderRadius: "20px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.contentType}</span>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{item.sourceCountry}</span>
                </div>
                <h3 className="usa-card__heading" style={{ margin: "0 0 0.4rem 0", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.4" }}>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleArticleClick(item.contentId)} style={{ color: isRead ? "#64748B" : "inherit", textDecoration: "none" }}>{item.title}</a>
                </h3>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", color: "#9CA3AF", lineHeight: "1.5" }}>{item.summary}</p>
              </div>
              <div style={{ padding: "0.5rem 1rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                  {item.sourceName} · {item.publicationDate ? timeAgo(item.publicationDate) : item.durationLabel}
                </span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <BookmarkButton item={item} />
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleArticleClick(item.contentId)} style={{ fontSize: "0.72rem", color: "#60a5fa" }} aria-label="Open article">↗</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => setPage(page + 1)} type="button" style={{ padding: "0.6rem 2rem", background: "rgba(239,1,7,0.1)", color: "#EF0107", border: "2px solid #EF0107", borderRadius: "20px", fontWeight: "600", cursor: "pointer", fontSize: "0.88rem" }}>
            Load more ({filtered.length - displayed.length} remaining)
          </button>
        </div>
      )}
    </section>
  );
}