import React, { useEffect, useState } from "react";
import { SubscribeForm } from "./SubscribeForm";
import { fetchArsenalNews, ContentItem } from "../services/newsService";

export function DigestPreview() {
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArsenalNews()
      .then(data => {
        const newsOnly = data.filter(a => a.contentType === "news" || a.contentType === "blog");
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayArticles = newsOnly.filter(a => a.publicationDate && new Date(a.publicationDate) >= todayStart).slice(0, 10);
        const recent = todayArticles.length >= 5 ? todayArticles : newsOnly.slice(0, 10);
        setArticles(recent);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <section aria-label="Daily digest preview" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", letterSpacing: "0.03em", textTransform: "uppercase", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>Daily Digest Preview</h2>
      <div className="digest-cta" style={{ marginBottom: "2rem" }}>
        <div className="digest-cta__text">
          <h3 style={{ fontWeight: "600", fontSize: "1rem", margin: "0 0 0.25rem 0" }}>Get this in your inbox every morning</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#9CA3AF" }}>Subscribe to receive the Arsenal Daily Digest at 9:00 AM EST. Free, no spam, unsubscribe anytime.</p>
        </div>
        <SubscribeForm />
      </div>
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: "600", borderBottom: "1px solid rgba(239,1,7,0.3)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>{"Arsenal Daily Digest - " + today}</h3>
        <p style={{ color: "#9CA3AF", fontSize: "0.82rem", marginBottom: "1.25rem" }}>Top 10 Arsenal news and blog stories today:</p>
        {loading && <p>Loading digest...</p>}
        {!loading && articles.length === 0 && <p style={{ color: "#9CA3AF" }}>No articles found for today yet. Check back soon!</p>}
        {!loading && articles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {articles.map((article, i) => (
              <div key={article.contentId} style={{ display: "flex", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "flex-start" }}>
                <span style={{ color: "#EF0107", fontWeight: "700", fontSize: "1rem", minWidth: "26px", paddingTop: "2px" }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600", fontSize: "0.93rem", color: "#60a5fa", textDecoration: "none", lineHeight: "1.4", display: "block", marginBottom: "0.3rem" }}>{article.title}</a>
                  {article.summary && <p style={{ margin: "0 0 0.3rem 0", fontSize: "0.82rem", color: "#9CA3AF", lineHeight: "1.5" }}>{article.summary.slice(0, 150)}{article.summary.length > 150 ? "..." : ""}</p>}
                  <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{article.sourceName} · {article.publicationDate ? new Date(article.publicationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}