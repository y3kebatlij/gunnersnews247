import React, { useEffect, useState } from "react";

interface SavedArticle {
  contentId: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  contentType: string;
  publicationDate?: string;
  savedAt: string;
}

export function getBookmarks(): SavedArticle[] {
  try {
    const stored = localStorage.getItem("arsenal-bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function saveBookmark(article: Omit<SavedArticle, "savedAt">): void {
  const bookmarks = getBookmarks();
  if (bookmarks.find(b => b.contentId === article.contentId)) return;
  bookmarks.unshift({ ...article, savedAt: new Date().toISOString() });
  localStorage.setItem("arsenal-bookmarks", JSON.stringify(bookmarks.slice(0, 50)));
}

export function removeBookmark(contentId: string): void {
  const bookmarks = getBookmarks().filter(b => b.contentId !== contentId);
  localStorage.setItem("arsenal-bookmarks", JSON.stringify(bookmarks));
}

export function isBookmarked(contentId: string): boolean {
  return getBookmarks().some(b => b.contentId === contentId);
}

export function BookmarkList() {
  const [items, setItems] = useState<SavedArticle[]>([]);

  useEffect(() => {
    setItems(getBookmarks());
  }, []);

  const handleRemove = (contentId: string) => {
    removeBookmark(contentId);
    setItems(getBookmarks());
  };

  return (
    <section aria-label="Saved articles">
      <h2 className="usa-heading">Saved Articles</h2>
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
          <p style={{ fontSize: "2rem" }}>?</p>
          <p>No saved articles yet.</p>
          <p style={{ fontSize: "0.9rem" }}>Click the bookmark icon on any article to save it here for later reading.</p>
        </div>
      )}
      <ul className="usa-list usa-list--unstyled">
        {items.map((item) => (
          <li key={item.contentId} className="usa-card__container margin-bottom-2">
            <div className="usa-card__body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: "0.75rem",
                    background: "#1e3a5f",
                    color: "#60a5fa",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                    display: "inline-block"
                  }}>
                    {item.contentType}
                  </span>
                  <h3 style={{ margin: "0.25rem 0" }}>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="usa-link">
                      {item.title}
                    </a>
                  </h3>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>{item.summary}</p>
                  <p style={{ fontSize: "0.8rem", color: "#9CA3AF", margin: 0 }}>
                    {item.sourceName} · Saved {new Date(item.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.contentId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#EF0107",
                    fontSize: "1.2rem",
                    padding: "0 0 0 1rem",
                  }}
                  aria-label="Remove bookmark"
                  type="button"
                >
                  ?
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
