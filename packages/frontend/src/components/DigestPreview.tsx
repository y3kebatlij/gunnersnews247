import React, { useEffect, useState } from "react";
import { LoadingSkeleton } from "./LoadingSkeleton";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function DigestPreview() {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`${API_URL}/digest-preview`);
        if (!response.ok) throw new Error("Failed to load preview");
        setHtml(await response.text());
      } catch {
        setHtml("<p style='color:#EF4444;'>Unable to load digest preview.</p>");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, []);

  return (
    <section aria-label="Daily digest preview">
      <h2 className="usa-heading">Daily Digest Preview</h2>
      <p className="text-base-dark">This is what subscribers receive at 9:00 AM EST every day.</p>
      {loading && <LoadingSkeleton count={5} type="card" />}
      {!loading && (
        <div
          style={{ borderRadius: "8px", overflow: "hidden", marginTop: "1rem" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </section>
  );
}
