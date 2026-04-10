import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { NotificationPayload } from "@arsenal/shared";

interface WebSocketContextValue {
  notifications: NotificationPayload[];
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  notifications: [],
  connected: false,
});

export function useWebSocket(): WebSocketContextValue {
  return useContext(WebSocketContext);
}

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL ?? "";
const MAX_RECONNECT_DELAY = 30000;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (!WS_URL) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationPayload;
        setNotifications((prev) => [...prev, payload]);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(reconnectDelay.current, MAX_RECONNECT_DELAY);
      reconnectDelay.current = delay * 2;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ notifications, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
