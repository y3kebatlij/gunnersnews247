import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { DigestPreview } from "./components/DigestPreview";
import { NotFoundPage } from "./components/NotFoundPage";
import { VideoFeed } from "./components/VideoFeed";
import { WomenFeed } from "./components/WomenFeed";
import { fetchArsenalNews, fetchArsenalTransfers } from "./services/newsService";
import { fetchArsenalFixtures, fetchArsenalResults, fetchPremierLeagueStandings, fetchTopScorers } from "./services/footballService";

function Preloader() {
  useEffect(() => {
    const preload = async () => {
      try {
        await Promise.allSettled([
          fetchArsenalNews(),
          fetchArsenalTransfers(),
          fetchArsenalFixtures(),
          fetchArsenalResults(),
          fetchPremierLeagueStandings(),
          fetchTopScorers(),
        ]);
      } catch {}
    };
    preload();
  }, []);
  return null;
}

export function App() {
  return (
    <BrowserRouter basename="/arsenalnews-aradaw">
      <ThemeProvider>
        <WebSocketProvider>
          <div className="usa-layout-docs">
            <Preloader />
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
                  <Route path="/video" element={<VideoFeed />} />
                  <Route path="/digest" element={<DigestPreview />} />
                  <Route path="/women" element={<WomenFeed />} />
                  <Route path="*" element={<NotFoundPage />} />
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