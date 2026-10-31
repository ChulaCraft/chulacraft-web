"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

// Replaces the root layout when it throws, so it brings its own document and
// no global styles. Kept plain on purpose.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <html lang="th">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center" }}>
        <main>
          <h1>Something went wrong</h1>
          <p>The page could not load. Please try again.</p>
          <button type="button" onClick={() => retry()}>Try again</button>
        </main>
      </body>
    </html>
  );
}
