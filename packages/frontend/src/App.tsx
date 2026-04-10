import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { Header } from "./components/Header";
import { ContentFeed } from "./components/ContentFeed";
import { TransferFeed } from "./components/TransferFeed";
import { Scoreboard } from "./components/Scoreboard";
import { ScheduleView } from "./components/ScheduleView";
import { StandingsTable } from "./components/StandingsTable";
import { BookmarkList } from "./components/BookmarkList";
import { NotificationBanner } from "./components/NotificationBanner";

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <WebSocketProvider>
          <div className="usa-layout-docs">
            <Header />
            <main className="usa-section" id="main-content">
              <div className="grid-container">
                <Scoreboard />
                <Routes>
                  <Route path="/" element={<ContentFeed />} />
                  <Route path="/transfers" element={<TransferFeed />} />
                  <Route path="/schedule" element={<ScheduleView />} />
                  <Route path="/standings" element={<StandingsTable />} />
                  <Route path="/saved" element={<BookmarkList />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
            <NotificationBanner />
          </div>
        </WebSocketProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
