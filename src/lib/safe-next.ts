/** The one place a path stored before sign-in may send the player afterwards.
 *  Only the event check-in page is allowed, matched whole and case-sensitive on
 *  the literal string, so encoded slashes, backslashes, whitespace, a host or
 *  anything after the path all fail. */
const CHECK_IN_PATH = /^\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/check-in$/;

export function safeNext(value: string | null | undefined): string | null {
  return typeof value === "string" && CHECK_IN_PATH.test(value) ? value : null;
}

/** Cookie holding that path between the QR scan and the end of sign-in. */
export const NEXT_COOKIE = "cc_next";

/** Cookie holding the 5-minute check-in proof, scoped to that event's page. */
export const PROOF_COOKIE = "cc_checkin";

export const checkInPath = (eventId: string) => `/events/${eventId.toLowerCase()}/check-in`;

/** Options shared by both cookies. Secure everywhere but `next dev`, which
 *  serves plain http://localhost (the same split as upgrade-insecure-requests
 *  in src/proxy.ts). */
export const COOKIE_BASE = { httpOnly: true, secure: process.env.NODE_ENV !== "development", sameSite: "lax" } as const;
