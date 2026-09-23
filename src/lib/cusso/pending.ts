import { createHmac, timingSafeEqual } from "node:crypto";
import { getChulaSSOAppSecret } from "../env";

/** A validated Chula profile waiting for the signed-in user to confirm the link. */
export type PendingLink = {
  userId: string;
  uid: string;
  username: string;
  email: string | null;
  displayName: string | null;
  exp: number;
};

export const PENDING_LINK_COOKIE = "cu_pending";
export const PENDING_LINK_TTL_SECONDS = 300;

function sign(body: string) {
  return createHmac("sha256", getChulaSSOAppSecret()).update(`cu_pending:${body}`).digest("base64url");
}

export function sealPendingLink(link: Omit<PendingLink, "exp">) {
  const body = Buffer.from(JSON.stringify({ ...link, exp: Date.now() + PENDING_LINK_TTL_SECONDS * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the link only if this server signed it and it hasn't expired. */
export function openPendingLink(value: string | undefined): PendingLink | null {
  const [body, signature] = value?.split(".") ?? [];
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const link = JSON.parse(Buffer.from(body, "base64url").toString()) as PendingLink;
  return link.exp > Date.now() ? link : null;
}
