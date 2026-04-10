import React, { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type { NotificationPayload } from "@arsenal/shared";
import { NOTIFICATION_AUTO_DISMISS_MS } from "@arsenal/shared";

export function NotificationBanner() {
  const { notifications } = useWebSocket();
  const [queue, setQueue] = useState<NotificationPayload[]>([]);
  const [current, setCurrent] = useState<NotificationPayload | null>(null);
  const [interacting, setInteracting] = useState(false);

  // Add new notifications to queue
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      setQueue((prev) => [...prev, latest]);
    }
  }, [notifications]);

  // Show next notification from queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!current || interacting) return;

    const timer = setTimeout(() => {
      setCurrent(null);
    }, NOTIFICATION_AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [current, interacting]);

  const dismiss = useCallback(() => {
    setCurrent(null);
    setInteracting(false);
  }, []);

  if (!current) return null;

  return (
    <div
      className="usa-alert usa-alert--info"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        margin: 0,
        borderRadius: 0,
      }}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
    >
      <div className="usa-alert__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="usa-alert__text">{current.summary}</p>
        <button
          className="usa-button usa-button--unstyled"
          onClick={dismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
