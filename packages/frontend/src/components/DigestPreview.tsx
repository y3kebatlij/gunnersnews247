import React, { useEffect, useState } from "react";
import { SubscribeForm } from "./SubscribeForm";
import { fetchArsenalNews, ContentItem } from "../services/newsService";

export function DigestPreview() {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArsenalNews()
      .then(data => {
        const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
        const recent = data.filter(a => {
          if (!a.publicationDate) return false;
          return new Date(a.publicationDate).getTime() > fiveHoursAgo;
        }).slice(0, 8);
        setArticles(recent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <section aria-label="Daily digest preview">
      <h2 className="usa-heading">Daily Digest Preview</h2>
      <div className="digest-cta">
        <div className="digest-cta__text">
          <h3 className="digest-cta__title">Get this in your inbox every morning</h3>
          <p className="digest-cta__desc">Subscribe to receive the Arsenal Daily Digest at 9:00 AM EST. Free, no spam, unsubscribe anytime.</p>
        </div>
        <SubscribeForm />
      </div>
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem" }}>{"Arsenal Daily Digest - " + today}</h3>
        <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>Latest Arsenal news from the past 5 hours:</p>
        {loading && <p>Loading digest...</p>}
        {!loading && articles.length === 0 && <p style={{ color: "#9CA3AF" }}>No new articles in the last 5 hours. Check back soon!</p>}
        {!loading && articles.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {articles.map((article, i) => (
              <li key={article.contentId} style={{ display: "flex", gap: "1rem", padding: "0.85rem 0", borderBottom: "1px solid #1e3a5f", alignItems: "flex-start" }}>
                <span style={{ color: "#EF0107", fontWeight: "bold", fontSize: "1rem", minWidth: "24px" }}>{i + 1}.</span>
                <div>
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="usa-link" style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{article.title}</a>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#9CA3AF" }}>{article.sourceName} · {article.publicationDate ? new Date(article.publicationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}