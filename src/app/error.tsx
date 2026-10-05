"use client";

import { ErrorScreen } from "@/components/error-screen";

// Catches what a page or form action throws instead of handling, most often a
// lost connection mid-submit. retry() re-fetches the page in place.
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen
    code="Oops"
    title="Something went wrong"
    body="That may not have gone through, most likely a dropped connection. After retrying, check whether your change is there before doing it again."
    primary={{ label: "Try again", onClick: retry }}
    secondary={{ label: "Back to home", href: "/" }}
    help="If this keeps happening, let an admin know on Discord."
  />;
}
