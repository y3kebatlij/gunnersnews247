import React from "react";

interface LoadingSkeletonProps {
  count?: number;
  type?: "card" | "table" | "text";
}

export function LoadingSkeleton({ count = 3, type = "card" }: LoadingSkeletonProps) {
  if (type === "text") {
    return (
      <div className="skeleton-container" aria-busy="true" aria-label="Loading content">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-line" />
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="skeleton-container" aria-busy="true" aria-label="Loading table">
        <div className="skeleton-table-header" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-table-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-container" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}
