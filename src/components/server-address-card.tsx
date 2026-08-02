"use client";

import { useState } from "react";

type ServerAddressCardProps = {
  address?: string;
  className?: string;
};

export function ServerAddressCard({ address, className }: ServerAddressCardProps) {
  const [feedback, setFeedback] = useState("");
  const configured = Boolean(address);

  async function copyAddress() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setFeedback("Server address copied!");
    } catch {
      setFeedback("Could not copy automatically. Select the address and copy it manually.");
    }
  }

  return (
    <aside className={className} aria-label="Minecraft server information">
      <div>
        <span>Minecraft Java</span>
        <strong>{configured ? address : "Server address coming soon"}</strong>
      </div>
      {configured && (
        <button type="button" onClick={copyAddress} aria-describedby="copy-feedback">
          Copy IP
        </button>
      )}
      <p
        id="copy-feedback"
        aria-live="polite"
        aria-atomic="true"
        // Keep the online marker off transient clipboard feedback.
        data-status={!feedback && configured ? "online" : undefined}
      >
        {feedback || (configured ? "Online · Java 1.21.11" : "Server details will be posted here")}
      </p>
    </aside>
  );
}
