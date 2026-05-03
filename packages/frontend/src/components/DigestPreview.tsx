import React, { useEffect, useState } from "react";
import { SubscribeForm } from "./SubscribeForm";
import { fetchArsenalNews, ContentItem } from "../services/newsService";

export function DigestPreview() {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArsenalNews()
      .then(data => { setArticles(data.slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

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
        <h3 style={{ borderBottom: "2px solid #EF0107", paddingBottom: "0.5rem" }}>
          {"Arsenal Daily Digest - " + today}
        </h3>
        <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>
          Here is what subscribers will receive at 9:00 AM EST today:
        </p>
        {loading && <p>Loading digest...</p>}
        {!loading && articles.length === 0 && <p>No articles available yet.</p>}
        {!loading && articles.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {articles.map((article) => (
              <li key={article.contentId} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #1e3a5f", paddingBottom: "1rem" }}>
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="usa-link" style={{ fontWeight: "bold" }}>
                  {article.title}
                </a>
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>{article.summary}</p>
                <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>{article.sourceName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}