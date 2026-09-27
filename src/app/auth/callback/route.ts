import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import { classifyOAuthCallbackFailure, type AuthFailureReason } from "@/lib/auth-error";
import { createAdminClient } from "@/lib/supabase/server";
import { reconcileIdentities } from "@/lib/reconcile-identities";

function authErrorResponse(reason: AuthFailureReason) {
  const destination = new URL("/auth/error", getSiteUrl());
  destination.searchParams.set("reason", reason);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const failureReason = code ? "session_exchange_failed" : classifyOAuthCallbackFailure(
    url.searchParams.get("error"), url.searchParams.get("error_code"), url.searchParams.get("error_description"));
  // The OAuth callback is security-sensitive: never let callback parameters
  // choose where an authenticated user is sent. The path comes from reconcile only.
  const response = NextResponse.redirect(new URL("/welcome", getSiteUrl()));
  const { url: supabaseUrl, key } = getPublicSupabaseEnvironment();
  const supabase = createServerClient(supabaseUrl, key, {
    global: { fetch: createBoundedFetch() },
    cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) }
  });
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("oauth_session_exchange_failed", {
        reason: failureReason,
        errorCode: error.code ?? null,
        status: error.status ?? null
      });
      return authErrorResponse(failureReason);
    }
    if (!code) return authErrorResponse(failureReason);

    const { data: identityData, error: identityError } = await supabase.auth.getUserIdentities();
    if (identityError || !identityData) return authErrorResponse("session_exchange_failed");
    const outcome = await reconcileIdentities(supabase, createAdminClient(), data.user.id, identityData.identities);
    if (outcome.signOut) {
      await supabase.auth.signOut();
      const failure = authErrorResponse(outcome.reason);
      response.cookies.getAll().forEach((cookie) => failure.cookies.set(cookie));
      return failure;
    }
    response.headers.set("location", new URL(outcome.path, getSiteUrl()).toString());
    return response;
  } catch (error) {
    console.error("oauth_session_exchange_failed", {
      reason: failureReason,
      errorName: error instanceof Error ? error.name : "UnknownError"
    });
    return authErrorResponse(failureReason);
  }
}
