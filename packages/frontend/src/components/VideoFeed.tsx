import React, { useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  channel: string;
  channelColor: string;
  url: string;
  tag: string;
}

const VIDEOS: VideoItem[] = [
  // Arsenal FC Official
  { id: "v1", title: "Arsenal FC — Official YouTube Channel", description: "Match highlights, behind the scenes, player interviews and training sessions from Arsenal FC.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/@Arsenal", tag: "Official" },
  { id: "v2", title: "Arsenal vs Crystal Palace — Match Highlights", description: "Watch the highlights from Arsenal's upcoming Premier League clash at Selhurst Park.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/results?search_query=Arsenal+Crystal+Palace+highlights+2026", tag: "Highlights" },
  { id: "v3", title: "Arsenal vs PSG — Champions League Final", description: "Relive the drama from Arsenal's incredible Champions League Final against PSG.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/results?search_query=Arsenal+PSG+Champions+League+Final+2026", tag: "UCL" },
  { id: "v4", title: "Arsenal 1-0 Burnley — Premier League Highlights", description: "Highlights from Arsenal's vital Premier League win over Burnley.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/results?search_query=Arsenal+Burnley+1+0+highlights+2026", tag: "Highlights" },
  { id: "v5", title: "Viktor Gyokeres — All Goals & Assists for Arsenal", description: "Every goal and assist from Viktor Gyokeres since joining Arsenal FC.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/results?search_query=Gyokeres+Arsenal+all+goals+2026", tag: "Goals" },
  { id: "v6", title: "Arsenal Women 3-0 Aston Villa — WSL Highlights", description: "Alessia Russo stars as Arsenal Women cruise to a 3-0 win at Villa Park.", channel: "Arsenal FC Official", channelColor: "#EF0107", url: "https://www.youtube.com/results?search_query=Arsenal+Women+Aston+Villa+3+0+WSL+2026", tag: "Women" },
  // AFTV
  { id: "v7", title: "AFTV — Arsenal Fan TV Reactions & Analysis", description: "Post-match reactions, fan interviews and analysis from the largest Arsenal fan channel.", channel: "AFTV", channelColor: "#F59E0B", url: "https://www.youtube.com/@AFTVMedia", tag: "Fan TV" },
  { id: "v8", title: "AFTV — Arsenal vs PSG UCL Final Reactions", description: "AFTV fan reactions from Arsenal's Champions League Final against PSG.", channel: "AFTV", channelColor: "#F59E0B", url: "https://www.youtube.com/results?search_query=AFTV+Arsenal+PSG+Champions+League+Final+reaction+2026", tag: "Fan TV" },
  { id: "v9", title: "AFTV — Arsenal Premier League Title Race", description: "AFTV analysis and reactions as Arsenal push for the Premier League title.", channel: "AFTV", channelColor: "#F59E0B", url: "https://www.youtube.com/results?search_query=AFTV+Arsenal+Premier+League+title+2026", tag: "Fan TV" },
  // Sky Sports
  { id: "v10", title: "Sky Sports — Arsenal Premier League Preview", description: "Sky Sports analysis and preview of Arsenal's Premier League campaign.", channel: "Sky Sports", channelColor: "#0EA5E9", url: "https://www.youtube.com/results?search_query=Sky+Sports+Arsenal+Premier+League+2026", tag: "Analysis" },
  { id: "v11", title: "Sky Sports — Arsenal UCL Campaign Highlights", description: "Sky Sports coverage of Arsenal's incredible Champions League run.", channel: "Sky Sports", channelColor: "#0EA5E9", url: "https://www.youtube.com/results?search_query=Sky+Sports+Arsenal+Champions+League+2026", tag: "UCL" },
  { id: "v12", title: "Sky Sports — Mikel Arteta Press Conference", description: "Latest Mikel Arteta press conference ahead of Arsenal's next match.", channel: "Sky Sports", channelColor: "#0EA5E9", url: "https://www.youtube.com/results?search_query=Arteta+press+conference+Arsenal+2026", tag: "Press Conf" },
];

const TAGS = ["All", "Highlights", "UCL", "Goals", "Women", "Fan TV", "Analysis", "Press Conf", "Official"];

export function VideoFeed() {
  const [activeTag, setActiveTag] = useState("All");

  const filtered = activeTag === "All" ? VIDEOS : VIDEOS.filter(v => v.tag === activeTag);

  return (
    <section aria-label="Arsenal videos" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "3px solid #EF0107", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Arsenal Videos</h2>

      {/* Filter tags */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.25rem", scrollbarWidth: "none" }}>
        {TAGS.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)} type="button" style={{ flexShrink: 0, padding: "0.3rem 0.85rem", borderRadius: "20px", border: `2px solid ${activeTag === tag ? "#EF0107" : "rgba(255,255,255,0.2)"}`, background: activeTag === tag ? "#EF0107" : "transparent", color: activeTag === tag ? "white" : "inherit", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>{tag}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {filtered.map((video) => (
          <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", display: "flex", gap: "1rem", padding: "0.85rem 1rem", alignItems: "center", transition: "background 0.2s" }}>
            <div style={{ width: "72px", height: "72px", background: video.channelColor, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.9 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.3rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", background: `${video.channelColor}22`, color: video.channelColor, padding: "1px 8px", borderRadius: "20px", fontWeight: "600" }}>{video.tag}</span>
                <span style={{ fontSize: "0.68rem", color: "#64748B" }}>{video.channel}</span>
              </div>
              <p style={{ margin: "0 0 0.25rem 0", fontWeight: "600", fontSize: "0.92rem", color: "white", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.title}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#9CA3AF", lineHeight: "1.4" }}>{video.description}</p>
            </div>
            <div style={{ color: "#EF0107", fontSize: "1.1rem", flexShrink: 0 }}>↗</div>
          </a>
        ))}
      </div>

      <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1.25rem" }}>
        Videos open on YouTube. Arsenal FC Official · AFTV · Sky Sports
      </p>
    </section>
  );
}