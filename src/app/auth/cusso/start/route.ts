import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getChulaLoginURL } from "@/lib/cusso/client";
import { getSiteUrl } from "@/lib/env";

// Every Chula flow starts here. The nonce is both in an httpOnly cookie and in
// the callback URL, so a ticket planted by someone else can neither sign the
// victim into the attacker's account nor link the attacker's Chula account to
// the victim's. The cookie also carries the intent (`link` or `login`).
export async function GET(request: NextRequest) {
  const callback = new URL("/auth/cucallback", request.nextUrl.origin);
  const intent = request.nextUrl.searchParams.get("intent") === "link" ? "link" : "login";
  const nonce = randomUUID();
  callback.searchParams.set("state", nonce);

  let loginUrl;
  try {
    loginUrl = getChulaLoginURL(callback.toString());
  } catch {
    return NextResponse.redirect(new URL("/auth/error?reason=start_failed", getSiteUrl()));
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set("cu_state", `${intent}:${nonce}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/cucallback",
    maxAge: 600
  });
  return response;
}
