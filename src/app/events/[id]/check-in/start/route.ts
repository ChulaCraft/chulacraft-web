import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { UUID } from "@/lib/registration";
import { checkInPath, COOKIE_BASE, NEXT_COOKIE, PROOF_COOKIE } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/** Target of the staff QR. Trades the 60-second token for a 5-minute proof
 *  (checkin_proof is granted to anon, so this works signed out) and never
 *  records attendance itself: link previews and prefetches also send GETs. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = getSiteUrl();
  if (!UUID.test(id)) return NextResponse.redirect(new URL("/events", site));
  const page = checkInPath(id);
  const token = request.nextUrl.searchParams.get("t") ?? "";

  const supabase = await createClient();
  let proof: string | null = null;
  let signedIn = false;
  try {
    const [result, auth] = await Promise.all([
      supabase.rpc("checkin_proof", { p_event_id: id, p_token: token }),
      supabase.auth.getUser()
    ]);
    proof = result.error ? null : result.data;
    signedIn = Boolean(auth.data.user);
  } catch {
    proof = null;
  }
  if (!proof) return NextResponse.redirect(new URL(`${page}?error=TOKEN_EXPIRED`, site));

  const response = NextResponse.redirect(new URL(signedIn ? page : "/register", site));
  response.cookies.set(PROOF_COOKIE, proof, { ...COOKIE_BASE, path: page, maxAge: 300 });
  // /auth/callback never takes a caller-chosen destination, so the way back
  // after sign-in is this cookie, which /welcome hands to /check-in/continue.
  if (!signedIn) response.cookies.set(NEXT_COOKIE, page, { ...COOKIE_BASE, path: "/", maxAge: 600 });
  return response;
}
