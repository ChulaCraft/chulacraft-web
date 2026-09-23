import { NextResponse, type NextRequest } from "next/server";
import { getChulaLoginURL } from "@/lib/cusso/client";
import { getSiteUrl } from "@/lib/env";

// Every Chula flow starts here. Chula SSO ignores our `service` URL and always
// returns to the callback registered for the app (no query params survive), so
// the only proof that this browser started the flow is this short-lived
// httpOnly cookie. It also carries the intent (`link` or `login`).
// A cross-site page could otherwise open this URL in a popup to arm the cookie
// and then deliver its own ticket, so only our own pages (or a typed URL) may
// start a flow. Links are additionally confirmed at /auth/cusso/confirm.
export async function GET(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.redirect(new URL("/auth/error?reason=start_failed", getSiteUrl()));
  }

  const callback = new URL("/auth/cucallback", request.nextUrl.origin);
  const intent = request.nextUrl.searchParams.get("intent") === "link" ? "link" : "login";

  let loginUrl;
  try {
    loginUrl = getChulaLoginURL(callback.toString());
  } catch {
    return NextResponse.redirect(new URL("/auth/error?reason=start_failed", getSiteUrl()));
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set("cu_state", intent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/cucallback",
    maxAge: 600
  });
  return response;
}
