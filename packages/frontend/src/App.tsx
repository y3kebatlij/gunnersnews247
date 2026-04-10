import React, { useState } from "react";
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

type View = "feed" | "transfers" | "schedule" | "standings" | "bookmarks";

export function App() {
  const [currentView, setCurrentView] = useState<View>("feed");

  return (
    <ThemeProvider>
      <WebSocketProvider>
        <div className="usa-layout-docs">
          <Header onNavigate={setCurrentView} currentView={currentView} />
          <main className="usa-section" id="main-content">
            <div className="grid-container">
              <Scoreboard />
              {currentView === "feed" && <ContentFeed />}
              {currentView === "transfers" && <TransferFeed />}
              {currentView === "schedule" && <ScheduleView />}
              {currentView === "standings" && <StandingsTable />}
              {currentView === "bookmarks" && <BookmarkList />}
            </div>
          </main>
          <NotificationBanner />
        </div>
      </WebSocketProvider>
    </ThemeProvider>
  );
}
