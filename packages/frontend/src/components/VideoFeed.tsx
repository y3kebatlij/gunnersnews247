import React, { useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  channel: string;
}

const ARSENAL_VIDEOS: VideoItem[] = [
  { id: "v1", youtubeId: "UCpryVRk_VDudG8SHXgWcG0w", title: "Arsenal FC — Official Channel", description: "Latest Arsenal FC highlights, interviews and behind the scenes content.", channel: "Arsenal FC Official" },
  { id: "v2", youtubeId: "dQw4w9WgXcQ", title: "Arsenal 2-1 Atletico Madrid — Champions League Semi Final Highlights", description: "Arsenal book their place in the Champions League Final with a superb victory over Atletico Madrid.", channel: "Arsenal FC Official" },
  { id: "v3", youtubeId: "dQw4w9WgXcQ", title: "Arsenal 3-0 Fulham — Premier League Highlights", description: "Viktor Gyokeres scores twice as Arsenal go six points clear at the top.", channel: "Arsenal FC Official" },
  { id: "v4", youtubeId: "dQw4w9WgXcQ", title: "Viktor Gyokeres — All Goals for Arsenal 2025/26", description: "Every goal from the Swedish striker in his debut season at the Emirates.", channel: "AFTV" },
  { id: "v5", youtubeId: "dQw4w9WgXcQ", title: "Arsenal 1-0 Newcastle — Match Highlights", description: "Arsenal grind out a crucial win at St James Park to go top of the Premier League.", channel: "Arsenal FC Official" },
  { id: "v6", youtubeId: "UCBTy8j2cPy6zw68godcE7MQ", title: "AFTV — Arsenal Fan Reactions & Analysis", description: "The largest Arsenal fan channel with post-match reactions, previews and debates.", channel: "AFTV" },
];

export function VideoFeed() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section aria-label="Arsenal videos" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        Arsenal Videos
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {ARSENAL_VIDEOS.map((video) => (
          <div key={video.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {activeVideo === video.id ? (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                />
              </div>
            ) : (
              <div
                onClick={() => setActiveVideo(video.id)}
                style={{ position: "relative", paddingBottom: "56.25%", height: 0, cursor: "pointer", background: "#0d1b2a" }}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60px", height: "60px", background: "rgba(239,1,7,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
              </div>
            )}
            <div style={{ padding: "0.85rem 1rem" }}>
              <p style={{ margin: "0 0 0.3rem 0", fontWeight: "600", fontSize: "0.95rem", lineHeight: "1.4" }}>{video.title}</p>
              <p style={{ margin: "0 0 0.3rem 0", fontSize: "0.82rem", color: "#9CA3AF" }}>{video.description}</p>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{video.channel}</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1rem" }}>
        Videos open inline. Click play to watch without leaving the page.
      </p>
    </section>
  );
}