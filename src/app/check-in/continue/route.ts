import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { COOKIE_BASE, NEXT_COOKIE, safeNext } from "@/lib/safe-next";

/** /welcome is a Server Component and cannot delete cookies, so it sends the
 *  player here: clear cc_next, then go where it said if safeNext allows it. */
export async function GET(request: NextRequest) {
  const next = safeNext(request.cookies.get(NEXT_COOKIE)?.value);
  const response = NextResponse.redirect(new URL(next ?? "/dashboard", getSiteUrl()));
  response.cookies.set(NEXT_COOKIE, "", { ...COOKIE_BASE, path: "/", maxAge: 0 });
  return response;
}
