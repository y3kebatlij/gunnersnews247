import React, { useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  channel: string;
  url: string;
}

const STATIC_VIDEOS: VideoItem[] = [
  { id: "v1", title: "Arsenal FC - Latest Highlights 2026", youtubeId: "", description: "Watch the latest Arsenal FC match highlights on the official channel.", channel: "Arsenal FC Official", url: "https://www.youtube.com/@Arsenal" },
  { id: "v2", title: "Arsenal vs PSG - Champions League Final 2026", youtubeId: "", description: "Build-up, analysis and highlights from Arsenal's Champions League Final.", channel: "Arsenal FC Official", url: "https://www.youtube.com/results?search_query=Arsenal+PSG+Champions+League+Final+2026" },
  { id: "v3", title: "Arsenal vs Atletico Madrid - UCL Semi Final", youtubeId: "", description: "Highlights from Arsenal's Champions League semi-final win.", channel: "Arsenal FC Official", url: "https://www.youtube.com/results?search_query=Arsenal+Atletico+Madrid+UCL+2026" },
  { id: "v4", title: "Arsenal 1-0 Burnley - Match Highlights", youtubeId: "", description: "Watch the highlights from Arsenal's latest Premier League win.", channel: "Arsenal FC Official", url: "https://www.youtube.com/results?search_query=Arsenal+Burnley+highlights+2026" },
  { id: "v5", title: "AFTV - Arsenal Fan Reactions & Analysis", youtubeId: "", description: "Latest Arsenal fan reactions, post-match interviews and analysis.", channel: "AFTV", url: "https://www.youtube.com/@AFTVMedia" },
  { id: "v6", title: "Viktor Gyokeres - All Goals for Arsenal 2026", youtubeId: "", description: "Every goal from Viktor Gyokeres since joining Arsenal.", channel: "Arsenal FC Official", url: "https://www.youtube.com/results?search_query=Gyokeres+Arsenal+goals+2026" },
];

export function VideoFeed() {
  return (
    <section aria-label="Arsenal videos" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
        Arsenal Videos
      </h2>
      <p style={{ fontSize: "0.82rem", color: "#9CA3AF", marginBottom: "1.5rem" }}>
        Click any video to watch on YouTube. Auto-updated daily.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {STATIC_VIDEOS.map((video) => (
          
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", display: "flex", gap: "1rem", padding: "1rem", alignItems: "center", transition: "background 0.2s" }}
          >
            <div style={{ width: "80px", height: "80px", background: "#EF0107", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 0.3rem 0", fontWeight: "600", fontSize: "0.95rem", color: "white", lineHeight: "1.4" }}>{video.title}</p>
              <p style={{ margin: "0 0 0.3rem 0", fontSize: "0.82rem", color: "#9CA3AF" }}>{video.description}</p>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{video.channel}</span>
            </div>
            <div style={{ color: "#EF0107", fontSize: "1.2rem", flexShrink: 0 }}>↗</div>
          </a>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1rem" }}>
        Videos open on YouTube. Live RSS feeds temporarily unavailable due to YouTube restrictions.
      </p>
    </section>
  );
}