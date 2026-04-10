import React, { useState } from "react";

interface VideoEmbedProps {
  sourceUrl: string;
  title: string;
}

export function VideoEmbed({ sourceUrl, title }: VideoEmbedProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="usa-alert usa-alert--info usa-alert--slim" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">This video is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-embed">
      <video
        controls
        aria-label={`Video: ${title}`}
        style={{ width: "100%", maxWidth: "640px" }}
        onError={() => setError(true)}
      >
        <source src={sourceUrl} />
        <p>Your browser does not support video playback. <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Watch on source site</a>.</p>
      </video>
    </div>
  );
}
