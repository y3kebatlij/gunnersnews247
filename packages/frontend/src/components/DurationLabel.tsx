import React from "react";

interface DurationLabelProps {
  label: string;
}

export function DurationLabel({ label }: DurationLabelProps) {
  return (
    <span className="usa-tag" aria-label={`Duration: ${label}`}>
      {label}
    </span>
  );
}
