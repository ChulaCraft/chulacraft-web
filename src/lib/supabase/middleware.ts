import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnvironment } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { Database } from "@/lib/supabase/database.types";

/** Next.js reads the CSP nonce out of the request's Content-Security-Policy while rendering,
 * so the header must be set on the initial response and on every rebuild after a cookie write. */
function withCsp(request: NextRequest, csp?: string) {
  const requestHeaders = new Headers(request.headers);
  if (csp) requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (csp) response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function updateSession(request: NextRequest, csp?: string) {
  const { url, key } = getPublicSupabaseEnvironment();

  const buildResponse = () => withCsp(request, csp);

  let response = buildResponse();
  const supabase = createServerClient<Database>(url, key, {
    global: { fetch: createBoundedFetch() },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = buildResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // getClaims verifies the JWT locally against cached JWKS (and still refreshes expired sessions),
  // so navigations skip the Auth-server round trip getUser() costs. Pages re-check with getUser().
  try { await supabase.auth.getClaims(); } catch { /* Leave a retryable unauthenticated response; never expose network details. */ }
  return response;
}
