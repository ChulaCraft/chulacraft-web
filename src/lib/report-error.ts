"use client";

import { normaliseRoute } from "@/lib/error-route";

// Browser side of error capture. Sends to /api/client-errors, which scrubs and stores.
const MAX_PER_ERROR = 5;
const seen = new Map<string, number>();

/** Reports a render error. At most 5 per distinct error per page load, and it never throws.
 *  Errors with a digest came from the server, which already recorded them with the real
 *  message; reporting them again would count each failure twice. */
export function reportError(error: Error & { digest?: string }): void {
  try {
    if (error?.digest) return;
    const message = String(error?.message ?? "").slice(0, 500);
    const route = normaliseRoute(window.location.pathname);
    const key = `${message.replace(/[0-9]+/g, "#")}|${route}`;
    const count = seen.get(key) ?? 0;
    if (count >= MAX_PER_ERROR) return;
    seen.set(key, count + 1);
    fetch("/api/client-errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ route, message }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Reporting must never throw out of an error boundary.
  }
}
