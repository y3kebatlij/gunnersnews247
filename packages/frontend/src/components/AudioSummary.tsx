import React, { useState, useEffect } from "react";
// v3 - force bundle refresh
import { fetchArsenalNews } from "../services/newsService";

type AudioState = "idle" | "loading" | "playing" | "paused" | "error";

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" fill="#EF0107"/>
      <path d="M5 11a7 7 0 0 0 14 0" stroke="#EF0107" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke="#EF0107" strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="22" x2="15" y2="22" stroke="#EF0107" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function AudioSummary() {
  const [state, setState] = useState<AudioState>("idle");
  const [script, setScript] = useState("");

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const handleGenerate = async () => {
    setState("loading");
    try {
      const articles = await fetchArsenalNews();
      const top5 = articles.slice(0, 5);
      const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      let text = "Good morning Arsenal fans! Here is your Arsenal briefing for " + date + ". ";
      top5.forEach((a, i) => { text += "Story " + (i + 1) + ": " + a.title + ". " + a.summary + " "; });
      text += "That is your Arsenal Daily Briefing. Come on you Gunners!";
      setScript(text);
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utt.voice = preferred;
      utt.onend = () => setState("idle");
      utt.onerror = (e) => { if (e.error !== "interrupted") setState("error"); };
      window.speechSynthesis.speak(utt);
      setState("playing");
    } catch { setState("error"); }
  };

  return (
    <section className="audio-summary" aria-label="Daily audio briefing">
      <div className="audio-summary__header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <MicIcon />
        <h3 className="audio-summary__title" style={{ margin: 0 }}>Daily Audio Briefing</h3>
        <span className="audio-summary__badge">~30 sec</span>
      </div>
      <p className="audio-summary__desc" style={{ marginTop: "0.5rem" }}>Listen to today's Arsenal news summary, powered by your browser's voice.</p>
      <div className="audio-summary__controls" style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        {state === "idle" && <button className="usa-button audio-summary__btn" onClick={handleGenerate} type="button">Play Briefing</button>}
        {state === "loading" && <button className="usa-button" disabled type="button">Generating...</button>}
        {state === "playing" && (
          <>
            <button className="usa-button" onClick={() => { window.speechSynthesis.pause(); setState("paused"); }} type="button">Pause</button>
            <button className="usa-button usa-button--outline" onClick={() => { window.speechSynthesis.cancel(); setState("idle"); }} type="button">Stop</button>
          </>
        )}
        {state === "paused" && (
          <>
            <button className="usa-button" onClick={() => { window.speechSynthesis.resume(); setState("playing"); }} type="button">Resume</button>
            <button className="usa-button usa-button--outline" onClick={() => { window.speechSynthesis.cancel(); setState("idle"); }} type="button">Stop</button>
          </>
        )}
        {state === "error" && (
          <div>
            <p style={{ color: "#EF0107" }}>Audio generation failed.</p>
            <button className="usa-button" onClick={handleGenerate} type="button">Retry</button>
          </div>
        )}
      </div>
      {script && state !== "idle" && (
        <details style={{ marginTop: "1rem" }}>
          <summary style={{ cursor: "pointer", color: "#9CA3AF" }}>View transcript</summary>
          <p style={{ fontSize: "0.9rem" }}>{script}</p>
        </details>
      )}
    </section>
  );
}