import React, { useEffect, useState } from "react";
import { ContentItemCard } from "./ContentItemCard";

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
}

function getBookmarkIds(): string[] {
  try {
    const stored = localStorage.getItem("arsenal-bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function BookmarkList() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarked = async () => {
      const ids = getBookmarkIds();
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const fetched: ContentItem[] = [];
        for (const id of ids) {
          const response = await fetch(`${API_URL}/content/${id}`);
          if (response.ok) {
            fetched.push(await response.json());
          }
        }
        setItems(fetched);
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarked();
  }, []);

  return (
    <section aria-label="Saved articles">
      <h2 className="usa-heading">Saved Articles</h2>
      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No saved articles yet.</p>}
      <div className="usa-card-group">
        {items.map((item) => (
          <ContentItemCard key={item.contentId} item={item} />
        ))}
      </div>
    </section>
  );
}
