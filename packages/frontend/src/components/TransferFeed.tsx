import React, { useEffect, useState } from "react";
import type { TransferType } from "@arsenal/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface TransferItem {
  contentId: string;
  title: string;
  summary: string;
  durationLabel: string;
  sourceUrl: string;
  sourceName: string;
  sourceCountry: string;
  transferType: TransferType;
  publicationDate: string;
}

const CONFIRMED_TYPES: TransferType[] = ["confirmed_signing", "loan", "contract_extension", "departure"];

function transferLabel(type: TransferType): string {
  const labels: Record<TransferType, string> = {
    rumor: "Rumor",
    confirmed_signing: "Confirmed",
    loan: "Loan",
    contract_extension: "Extension",
    departure: "Departure",
  };
  return labels[type] ?? type;
}

export function TransferFeed() {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(`${API_URL}/transfers`);
        if (!response.ok) throw new Error("Failed to fetch transfers");
        const data = await response.json();
        setItems(data.items ?? []);
      } catch {
        setError("Unable to load transfer news.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  return (
    <section aria-label="Transfer news">
      <h2 className="usa-heading">Transfer News</h2>
      {loading && <p>Loading...</p>}
      {error && (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body"><p className="usa-alert__text">{error}</p></div>
        </div>
      )}
      {!loading && !error && items.length === 0 && <p>No current transfer activity.</p>}
      <ul className="usa-list usa-list--unstyled">
        {items.map((item) => {
          const isConfirmed = CONFIRMED_TYPES.includes(item.transferType);
          return (
            <li key={item.contentId} className="usa-card__container margin-bottom-2">
              <div className="usa-card__body">
                <span
                  className={`usa-tag ${isConfirmed ? "bg-green" : "bg-gold"}`}
                  aria-label={isConfirmed ? "Confirmed transfer" : "Unconfirmed rumor"}
                >
                  {transferLabel(item.transferType)}
                </span>
                <h3>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="usa-link">
                    {item.title}
                  </a>
                </h3>
                <p>{item.summary}</p>
                <p className="text-base-dark font-sans-3xs">
                  {item.sourceName} · {item.sourceCountry}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
