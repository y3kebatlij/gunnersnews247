import React, { useState, useEffect } from "react";

interface BookmarkButtonProps {
  contentId: string;
}

function getBookmarks(): string[] {
  try {
    const stored = localStorage.getItem("arsenal-bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: string[]): void {
  try {
    localStorage.setItem("arsenal-bookmarks", JSON.stringify(bookmarks));
  } catch {
    // localStorage unavailable
  }
}

export function BookmarkButton({ contentId }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(getBookmarks().includes(contentId));
  }, [contentId]);

  const toggle = () => {
    const current = getBookmarks();
    let updated: string[];

    if (current.includes(contentId)) {
      updated = current.filter((id) => id !== contentId);
      setBookmarked(false);
    } else {
      updated = [...current, contentId];
      setBookmarked(true);
    }

    saveBookmarks(updated);
  };

  return (
    <button
      className="usa-button usa-button--unstyled"
      onClick={toggle}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={bookmarked}
      type="button"
    >
      {bookmarked ? "★" : "☆"}
    </button>
  );
}
