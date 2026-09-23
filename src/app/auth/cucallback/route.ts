import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { AuthFailureReason } from "@/lib/auth-error";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveTicket, type ProfilePayload } from "@/lib/cusso/server";

// Like the Discord callback, destinations are fixed; never taken from the request.
function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, getSiteUrl()));
}

function authErrorResponse(reason: AuthFailureReason) {
  return redirectTo(`/auth/error?reason=${reason}`);
}

export async function GET(request: NextRequest) {
  const response = await handle(request);
  // The state cookie is single-use on every exit path.
  response.cookies.set("cu_state", "", { path: "/auth/cucallback", maxAge: 0 });
  return response;
}

async function handle(request: NextRequest) {
  // Reject tickets this browser didn't ask for (see /auth/cusso/start).
  const [intent, nonce] = request.cookies.get("cu_state")?.value.split(":") ?? [];
  if (!nonce || nonce !== request.nextUrl.searchParams.get("state")) return authErrorResponse("start_failed");

  const ticket = request.nextUrl.searchParams.get("ticket");
  if (!ticket) return authErrorResponse("start_failed");

  let profile: ProfilePayload;
  try {
    const result = await resolveTicket(ticket);
    if (result.error) return authErrorResponse(result.error.status === 401 ? "cu_ticket_invalid" : "provider_error");
    profile = result.profile;
  } catch {
    return authErrorResponse("provider_error");
  }
  if (profile.disable) return authErrorResponse("cu_disabled");

  let user;
  try {
    ({ data: { user } } = await (await createClient()).auth.getUser());
  } catch {
    return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 });
  }

  try {
    const admin = createAdminClient();
    if (user) return intent === "link" ? await linkToSignedInUser(admin, user.id, profile) : redirectTo("/welcome");
    return await signInLinkedUser(request, admin, profile);
  } catch {
    return authErrorResponse("other");
  }
}

async function linkToSignedInUser(admin: ReturnType<typeof createAdminClient>, userId: string, profile: ProfilePayload) {
  const { error } = await admin.rpc("link_cu_sso", {
    p_user_id: userId,
    p_chula_uid: profile.uid,
    p_chula_username: profile.username,
    p_email: profile.email || null,
    p_display_name: `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim() || null
  });
  if (error) return authErrorResponse(error.message.includes("CU_ALREADY_LINKED") ? "cu_already_linked" : "other");
  return redirectTo("/welcome?linked=cu");
}

// Chula SSO sign-in mints a real Supabase session for the already-linked user:
// the service key generates a one-time magic-link token (no email is sent) and
// the cookie-bound client exchanges it, exactly as an emailed link would.
async function signInLinkedUser(request: NextRequest, admin: ReturnType<typeof createAdminClient>, profile: ProfilePayload) {
  const { data: link, error: linkError } = await admin
    .from("cu_sso_identities").select("user_id").eq("chula_uid", profile.uid).maybeSingle();
  if (linkError) return authErrorResponse("other");
  if (!link) return authErrorResponse("cu_not_linked");

  const { data: { user }, error: userError } = await admin.auth.admin.getUserById(link.user_id);
  if (userError || !user) return authErrorResponse("other");
  if (!user.email) return authErrorResponse("cu_no_email");

  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (generateError) return authErrorResponse("session_exchange_failed");

  const response = redirectTo("/welcome");
  const { url, key } = getPublicSupabaseEnvironment();
  const supabase = createServerClient(url, key, {
    global: { fetch: createBoundedFetch() },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    }
  });
  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: generated.properties.hashed_token });
  if (error) return authErrorResponse("session_exchange_failed");
  return response;
}
