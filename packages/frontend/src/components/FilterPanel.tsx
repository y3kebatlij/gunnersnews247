import React from "react";
import { CONTENT_TYPES } from "@arsenal/shared";

interface FilterPanelProps {
  contentType: string;
  sourceCountry: string;
  onContentTypeChange: (value: string) => void;
  onSourceCountryChange: (value: string) => void;
}

export function FilterPanel({
  contentType,
  sourceCountry,
  onContentTypeChange,
  onSourceCountryChange,
}: FilterPanelProps) {
  return (
    <fieldset className="usa-fieldset filter-panel">
      <legend className="usa-sr-only">Filter content</legend>
      <div className="filter-type-row" role="group" aria-label="Content type filter">
        <button
          className={`filter-chip ${contentType === "" ? "filter-chip--active" : ""}`}
          onClick={() => onContentTypeChange("")}
          aria-pressed={contentType === ""}
          type="button"
        >
          All
        </button>
        {CONTENT_TYPES.map((type) => (
          <button
            key={type}
            className={`filter-chip ${contentType === type ? "filter-chip--active" : ""}`}
            onClick={() => onContentTypeChange(type)}
            aria-pressed={contentType === type}
            type="button"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <div className="filter-country">
        <label className="usa-label" htmlFor="filter-country">Country</label>
        <input
          className="usa-input"
          id="filter-country"
          type="text"
          placeholder="e.g. England"
          value={sourceCountry}
          onChange={(e) => onSourceCountryChange(e.target.value)}
        />
      </div>
    </fieldset>
  );
}
