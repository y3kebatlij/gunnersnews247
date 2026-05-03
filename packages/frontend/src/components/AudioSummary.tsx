import React, { useState, useEffect } from "react";
import { fetchArsenalNews } from "../services/newsService";

type AudioState = "idle" | "loading" | "playing" | "paused" | "error" | "unsupported";

export function AudioSummary() {
  const [state, setState] = useState<AudioState>("idle");
  const [script, setScript] = useState("");
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setState("unsupported");
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const generateScript = async (): Promise<string> => {
    const articles = await fetchArsenalNews();
    const top5 = articles.slice(0, 5);
    const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    let script = `Good morning Arsenal fans! Here is your Arsenal briefing for ${date}. `;
    top5.forEach((a, i) => {
      script += `Story ${i + 1}: ${a.title}. ${a.summary} `;
    });
    script += "That's your Arsenal Daily Briefing. Come on you Gunners!";
    return script;
  };

  const handleGenerate = async () => {
    setState("loading");
    try {
      const text = await generateScript();
      setScript(text);
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.pitch = 1;
      utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utt.voice = preferred;
      utt.onend = () => setState("idle");
      utt.onerror = () => setState("error");
      setUtterance(utt);
      window.speechSynthesis.speak(utt);
      setState("playing");
    } catch {
      setState("error");
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setState("playing");
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  if (state === "unsupported") return null;

  return (
    <section className="audio-summary" aria-label="Daily audio briefing">
      <div className="audio-summary__header">
        <span className="audio-summary__icon" aria-hidden="true">mic</span>
        <h3 className="audio-summary__title">Daily Audio Briefing</h3>
        <span className="audio-summary__badge">~30 sec</span>
      </div>
      <p className="audio-summary__desc">
        Listen to today's Arsenal news summary, powered by your browser's voice.
      </p>
      <div className="audio-summary__controls" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {state === "idle" && (
          <button className="usa-button audio-summary__btn" onClick={handleGenerate} type="button">
            Play Briefing
          </button>
        )}
        {state === "loading" && (
          <button className="usa-button audio-summary__btn" disabled type="button">
            Generating...
          </button>
        )}
        {state === "playing" && (
          <>
            <button className="usa-button audio-summary__btn" onClick={handlePause} type="button">
              ? Pause
            </button>
            <button className="usa-button usa-button--outline audio-summary__btn" onClick={handleStop} type="button">
              � Stop
            </button>
          </>
        )}
        {state === "paused" && (
          <>
            <button className="usa-button audio-summary__btn" onClick={handleResume} type="button">
              ? Resume
            </button>
            <button className="usa-button usa-button--outline audio-summary__btn" onClick={handleStop} type="button">
              � Stop
            </button>
          </>
        )}
        {state === "error" && (
          <div>
            <p style={{ color: "#EF0107" }}>Audio generation failed.</p>
            <button className="usa-button audio-summary__btn" onClick={handleGenerate} type="button">
              ? Retry
            </button>
          </div>
        )}
      </div>
      {script && state !== "idle" && (
        <details className="audio-summary__transcript" style={{ marginTop: "1rem" }}>
          <summary style={{ cursor: "pointer", color: "#9CA3AF" }}>View transcript</summary>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>{script}</p>
        </details>
      )}
    </section>
  );
}
