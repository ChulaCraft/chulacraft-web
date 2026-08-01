import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import { classifyOAuthCallbackFailure, type AuthFailureReason } from "@/lib/auth-error";

function authErrorResponse(reason: AuthFailureReason) {
  const destination = new URL("/auth/error", getSiteUrl());
  destination.searchParams.set("reason", reason);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const providerError = url.searchParams.get("error");
  const providerErrorCode = url.searchParams.get("error_code");
  // The OAuth callback is security-sensitive: never let callback parameters
  // choose where an authenticated user is sent.
  const destination = new URL("/register", getSiteUrl());
  const response = NextResponse.redirect(destination);
  const { url: supabaseUrl, key } = getPublicSupabaseEnvironment();
  const supabase = createServerClient(supabaseUrl, key, {
    global: { fetch: createBoundedFetch() },
    cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) }
  });
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const reason = code
        ? "session_exchange_failed"
        : classifyOAuthCallbackFailure(providerError, providerErrorCode);
      console.error("oauth_session_exchange_failed", {
        reason,
        errorCode: error.code ?? null,
        status: error.status ?? null
      });
      return authErrorResponse(reason);
    }
    if (!code) {
      return authErrorResponse(classifyOAuthCallbackFailure(providerError, providerErrorCode));
    }
    return response;
  } catch (error) {
    const reason = code
      ? "session_exchange_failed"
      : classifyOAuthCallbackFailure(providerError, providerErrorCode);
    console.error("oauth_session_exchange_failed", {
      reason,
      errorName: error instanceof Error ? error.name : "UnknownError"
    });
    return authErrorResponse(reason);
  }
}
