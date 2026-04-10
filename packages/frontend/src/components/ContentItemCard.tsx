import React from "react";
import { DurationLabel } from "./DurationLabel";
import { BookmarkButton } from "./BookmarkButton";
import { VideoEmbed } from "./VideoEmbed";

interface ContentItem {
  contentId: string;
  title: string;
  summary: string;
  durationLabel: string;
  sourceUrl: string;
  sourceName: string;
  sourceCountry: string;
  contentType: string;
  publicationDate?: string;
}

interface ContentItemCardProps {
  item: ContentItem;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ContentItemCard({ item }: ContentItemCardProps) {
  return (
    <article className="usa-card" aria-label={item.title}>
      <div className="usa-card__container">
        <div className="usa-card__header">
          <h3 className="usa-card__heading">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link"
            >
              {item.title}
            </a>{" "}
            <DurationLabel label={item.durationLabel} />
          </h3>
        </div>
        <div className="usa-card__body">
          <p>{item.summary}</p>
          <p className="text-base-dark font-sans-3xs">
            {item.sourceName} · {item.sourceCountry} · {item.contentType}
            {item.publicationDate && (
              <> · <time dateTime={item.publicationDate}>{timeAgo(item.publicationDate)}</time></>
            )}
          </p>
          {item.contentType === "video" && (
            <VideoEmbed sourceUrl={item.sourceUrl} title={item.title} />
          )}
        </div>
        <div className="usa-card__footer">
          <BookmarkButton contentId={item.contentId} />
        </div>
      </div>
    </article>
  );
}
