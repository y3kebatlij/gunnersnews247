import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { SubscribeForm } from "./SubscribeForm";

const NAV_ITEMS = [
  { path: "/", label: "News" },
  { path: "/transfers", label: "Transfers" },
  { path: "/schedule", label: "Schedule" },
  { path: "/standings", label: "Standings" },
  { path: "/women", label: "Women" },
  { path: "/digest", label: "Digest" },
  { path: "/saved", label: "Saved" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="usa-header usa-header--basic" role="banner">
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <div className="usa-logo">
              <em className="usa-logo__text">
                <NavLink to="/" className="header-logo-link">
                  <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true" className="header-crest">
                    <circle cx="50" cy="50" r="48" fill="#EF0107" stroke="#9C824A" strokeWidth="3"/>
                    <text x="50" y="58" textAnchor="middle" fill="white" fontSize="42" fontWeight="bold" fontFamily="serif">A</text>
                  </svg>
                  Arsenal News
                </NavLink>
              </em>
            </div>
            <button
              className="usa-menu-btn mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              type="button"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
          <nav
            className={`usa-nav ${menuOpen ? "usa-nav--open" : ""}`}
            id="main-nav"
            aria-label="Primary navigation"
          >
            <ul className="usa-nav__primary usa-accordion">
              {NAV_ITEMS.map(({ path, label }) => (
                <li key={path} className="usa-nav__primary-item">
                  <NavLink
                    to={path}
                    end={path === "/"}
                    className={({ isActive }) =>
                      `usa-nav__link ${isActive ? "usa-current" : ""}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="usa-nav__secondary">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
