import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSecretSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { AuthFailureReason } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/server";
import { resolveTicket } from "@/lib/cusso/server";

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

      // TODO: FIX THIS SHIT (should use jwt)
      // su
      const userEmail = user.data.user.email;
      if (!userEmail) {
        return authErrorResponse("other", "Cannot 'su' into a user that has no registered email address.");
      }
      
      // === BEGIN SU IMPLEMENTATION ===
      // TypeScript is now happy because userEmail is guaranteed to be a string
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail, 
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        return authErrorResponse("other", `Failed to generate su ticket: ${linkError?.message}`);
      }

      const { data: sessionData, error: authError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'email',
      });

      if (authError || !sessionData?.session) {
        return authErrorResponse("other", `Failed to establish session: ${authError?.message}`);
      }

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
