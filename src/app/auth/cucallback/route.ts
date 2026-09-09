import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSecretSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { AuthFailureReason } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/server";
import { resolveTicket } from "@/lib/cusso/server";
import jwt from 'jsonwebtoken';

function authErrorResponse(reason: AuthFailureReason, message?: string) {
  const destination = new URL("/auth/error", getSiteUrl());
  destination.searchParams.set("reason", reason);
  if (message) destination.searchParams.set("message", message);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  let user;
  try { ({ data: { user } } = await supabase.auth.getUser()); }
  catch { return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 }); }
  const url = new URL(request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return authErrorResponse("start_failed");
  try {
    const { error: error1, profile } = await resolveTicket(ticket);
    if (error1) {
      if (error1.status == 401) return authErrorResponse("other", "CU SSO Login Unauthorized");
      return authErrorResponse("provider_error");
    }

    const response = NextResponse.redirect("/welcome");
    const { url: supabaseUrl, key } = getSecretSupabaseEnvironment();
    const supabase = createServerClient(supabaseUrl, key, {
      global: { fetch: createBoundedFetch() },
      cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) }
    });
    let cu_registrations = supabase.from("cu_registrations");
    let q_res = await cu_registrations.select("sp_user_id").eq("uid", profile.uid).maybeSingle();
    if (q_res.success && q_res.data) {
      cu_registrations.update({ ...profile, pg_updated_at: new Date().toISOString() });
      let user = await supabase.auth.admin.getUserById(q_res.data.sp_user_id);
      if (!user.data.user) return authErrorResponse("other", "User not found or deleted.");

      // su
      const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
      const expirationSeconds = 60 * 60; // 1 Hour
      
      const supabaseCompatiblePayload = {
        aud: 'authenticated',
        role: 'authenticated', // Crucial for Postgres RLS access control
        sub: user.data.user.id, // The standard identifier in your table
        email: user.data.user.email,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
        app_metadata: { provider: 'custom_pipeline' },
        user_metadata: {}
      };

      const supabaseJWT = jwt.sign(supabaseCompatiblePayload, SUPABASE_JWT_SECRET);

      // 4. GENERATE THE NATIVE COOKIE CONTAINER 
      // Supabase stores access tokens and fake refresh tokens as a stringified array/JSON sequence.
      const cookieData = JSON.stringify([supabaseJWT, "custom-refresh-bypass-token"]);
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0].replace('https://', '');
      const cookieName = `sb-${projectRef}-auth-token`;

      // 5. RESPOND WITH SECURE HTTP COOKIES
      
      response.cookies.set(cookieName, cookieData, {
        path: '/',
        maxAge: expirationSeconds,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be false so the client SDK can read it to synchronize storage states
        sameSite: 'lax',
      });

      return response;
    }
    if (user) {
      cu_registrations.insert({ ...profile, sp_user_id: user.id });

      return response;
    }

    return authErrorResponse("other", "CU SSO Sign Up is currently unavailable.");
  } catch {
    return authErrorResponse("start_failed");
  }
}
