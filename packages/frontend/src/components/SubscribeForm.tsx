import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        const data = await response.json();
        setError(data.error ?? "Subscription failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <form className="usa-form usa-form--inline" onSubmit={handleSubmit}>
      <label className="usa-sr-only" htmlFor="subscribe-email">
        Email address
      </label>
      <input
        className="usa-input usa-input--small"
        id="subscribe-email"
        type="email"
        name="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-describedby={error ? "subscribe-error" : undefined}
        aria-invalid={error ? "true" : undefined}
      />
      <button className="usa-button usa-button--small" type="submit">
        Subscribe
      </button>
      {error && (
        <span id="subscribe-error" className="usa-error-message" role="alert">
          {error}
        </span>
      )}
      {success && (
        <span className="usa-success-message" role="status">
          Subscribed!
        </span>
      )}
    </form>
  );
}
