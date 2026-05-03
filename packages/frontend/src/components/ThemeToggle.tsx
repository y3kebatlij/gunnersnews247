import React from "react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background: "none",
        border: "2px solid currentColor",
        borderRadius: "20px",
        padding: "4px 12px",
        cursor: "pointer",
        fontSize: "0.85rem",
        color: "inherit",
      }}
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}