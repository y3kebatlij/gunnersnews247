import React, { useState, useEffect } from "react";
import { ContentItem } from "../services/newsService";
import { saveBookmark, removeBookmark, isBookmarked } from "./BookmarkList";

interface BookmarkButtonProps {
  item: ContentItem;
}

export function BookmarkButton({ item }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(item.contentId));
  }, [item.contentId]);

  const toggle = () => {
    if (bookmarked) {
      removeBookmark(item.contentId);
      setBookmarked(false);
    } else {
      saveBookmark({
        contentId: item.contentId,
        title: item.title,
        summary: item.summary,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        contentType: item.contentType,
        publicationDate: item.publicationDate,
      });
      setBookmarked(true);
    }
  };

  return (
    <button
      className="usa-button usa-button--unstyled"
      onClick={toggle}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={bookmarked}
      type="button"
      style={{ fontSize: "1.3rem", cursor: "pointer", background: "none", border: "none", color: bookmarked ? "#F59E0B" : "#64748B" }}
    >
      {bookmarked ? "★" : "☆"}
    </button>
  );
}