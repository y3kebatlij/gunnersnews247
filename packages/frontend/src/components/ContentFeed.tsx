import React, { useEffect, useState, useCallback } from "react";
import { ContentItemCard } from "./ContentItemCard";
import { FilterPanel } from "./FilterPanel";
import { AudioSummary } from "./AudioSummary";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorRetry } from "./ErrorRetry";
import { fetchArsenalNews, ContentItem } from "../services/newsService";

const PAGE_SIZE = 10;
const MAX_ARTICLES = 25;

function timeAgoShort(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function ContentFeed({ contentType: initialType }: { contentType?: string } = {}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [contentType, setContentType] = useState(initialType ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchArsenalNews(contentType || undefined);
      setItems(data.slice(0, MAX_ARTICLES));
      setLastUpdated(new Date());
      setPage(1);
    } catch {
      setError("Unable to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const trimmed = searchTerm.trim().toLowerCase();
  const filtered = trimmed.length < 2
    ? items
    : items.filter(
        (item) =>
          item.title.toLowerCase().includes(trimmed) ||
          item.summary.toLowerCase().includes(trimmed) ||
          item.sourceName.toLowerCase().includes(trimmed)
      );

  const displayItems = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  return (
    <section aria-label="News feed">
      <div className="welcome-banner">
        <h2 className="welcome-banner__title">Your Daily Arsenal Fix</h2>
        <p className="welcome-banner__text">
          News, transfers, podcasts, and blogs from {items.length > 0 ? items.length : "25"}+ articles worldwide.
        </p>
        {lastUpdated && (
          <span className="welcome-banner__updated" aria-label="Last updated">
            Updated {timeAgoShort(lastUpdated)}
          </span>
        )}
      </div>

      <AudioSummary />

      <FilterPanel
        contentType={contentType}
        searchTerm={searchTerm}
        onContentTypeChange={(v) => { setContentType(v); setPage(1); }}
        onSearchTermChange={(v) => { setSearchTerm(v); setPage(1); }}
      />

      {loading && <LoadingSkeleton count={5} type="card" />}
      {error && <ErrorRetry message={error} onRetry={fetchContent} />}
      {!loading && !error && filtered.length === 0 && (
        <p>{trimmed ? `No results for "${searchTerm}".` : "No content available."}</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <p className="results-count">
          Showing {displayItems.length} of {filtered.length} articles
        </p>
      )}

      <div className="usa-card-group">
        {displayItems.map((item) => (
          <ContentItemCard key={item.contentId} item={item} searchTerm={searchTerm.trim()} />
        ))}
      </div>

      {hasMore && (
        <div className="load-more">
          <button
            className="usa-button load-more__btn"
            onClick={() => setPage(page + 1)}
            type="button"
          >
            Load more ({filtered.length - displayItems.length} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
