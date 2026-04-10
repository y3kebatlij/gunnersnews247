import React from "react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      className="usa-button usa-button--unstyled"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      type="button"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
