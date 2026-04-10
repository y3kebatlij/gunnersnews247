import React from "react";

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  return (
    <div className="usa-alert usa-alert--error" role="alert">
      <div className="usa-alert__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="usa-alert__text">{message}</p>
        <button
          className="usa-button usa-button--small"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
