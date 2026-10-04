import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnvironment } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";

export async function updateSession(request: NextRequest) {
  const { url, key } = getPublicSupabaseEnvironment();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    global: { fetch: createBoundedFetch() },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  // getClaims verifies the JWT locally against cached JWKS (and still refreshes expired sessions),
  // so navigations skip the Auth-server round trip getUser() costs. Pages re-check with getUser().
  try { await supabase.auth.getClaims(); } catch { /* Leave a retryable unauthenticated response; never expose network details. */ }
  return response;
}
