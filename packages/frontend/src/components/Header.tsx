import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SubscribeForm } from "./SubscribeForm";

type View = "feed" | "transfers" | "schedule" | "standings" | "bookmarks";

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "feed", label: "News" },
  { view: "transfers", label: "Transfers" },
  { view: "schedule", label: "Schedule" },
  { view: "standings", label: "Standings" },
  { view: "bookmarks", label: "Saved" },
];

export function Header({ onNavigate, currentView }: HeaderProps) {
  return (
    <header className="usa-header usa-header--basic" role="banner">
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <div className="usa-logo">
            <em className="usa-logo__text">
              <button
                className="usa-button--unstyled"
                onClick={() => onNavigate("feed")}
                style={{ cursor: "pointer", fontWeight: "bold", color: "#EF0107" }}
              >
                Arsenal News
              </button>
            </em>
          </div>
        </div>
        <nav className="usa-nav" aria-label="Primary navigation">
          <ul className="usa-nav__primary usa-accordion">
            {NAV_ITEMS.map(({ view, label }) => (
              <li key={view} className="usa-nav__primary-item">
                <button
                  className={`usa-button--unstyled usa-nav__link ${
                    currentView === view ? "usa-current" : ""
                  }`}
                  onClick={() => onNavigate(view)}
                  aria-current={currentView === view ? "page" : undefined}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <div className="usa-nav__secondary">
            <ThemeToggle />
            <SubscribeForm />
          </div>
        </nav>
      </div>
    </header>
  );
}
