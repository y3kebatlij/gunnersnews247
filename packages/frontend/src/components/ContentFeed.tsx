import React, { useEffect, useState, useCallback } from "react";
import { ContentItemCard } from "./ContentItemCard";
import { FilterPanel } from "./FilterPanel";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorRetry } from "./ErrorRetry";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface ContentItem {
  contentId: string;
  title: string;
  summary: string;
  durationLabel: string;
  sourceUrl: string;
  sourceName: string;
  sourceCountry: string;
  contentType: string;
  publicationDate?: string;
}

export function ContentFeed() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [contentType, setContentType] = useState("");
  const [sourceCountry, setSourceCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (contentType) params.set("contentType", contentType);
      if (sourceCountry) params.set("sourceCountry", sourceCountry);

      const response = await fetch(`${API_URL}/content?${params}`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setError("Unable to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [contentType, sourceCountry]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <section aria-label="News feed">
      <h2 className="usa-heading">Latest Arsenal News</h2>
      <FilterPanel
        contentType={contentType}
        sourceCountry={sourceCountry}
        onContentTypeChange={setContentType}
        onSourceCountryChange={setSourceCountry}
      />
      {loading && <LoadingSkeleton count={5} type="card" />}
      {error && <ErrorRetry message={error} onRetry={fetchContent} />}
      {!loading && !error && items.length === 0 && <p>No content available.</p>}
      <div className="usa-card-group">
        {items.map((item) => (
          <ContentItemCard key={item.contentId} item={item} />
        ))}
      </div>
    </section>
  );
}
