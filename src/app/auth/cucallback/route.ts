import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getChulaSSOAppId, getChulaSSOAppSecret, getPublicSupabaseEnvironment, getSiteUrl } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { AuthFailureReason } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/server";

function authErrorResponse(reason: AuthFailureReason) {
  const destination = new URL("/auth/error", getSiteUrl());
  destination.searchParams.set("reason", reason);
  return NextResponse.redirect(destination);
}

export type ProfilePayload = {
  /**Student / staff ID number */
  uid:	string,
  /** Chula IT account name (e.g. pkrerk) */
  username:	string,
  /** First name (English) */
  firstname:	string,
  /** Last name (English) */
  lastname:	string,
  /** First name (Thai) */
  firstnameTH:	string,
  /** Last name (Thai) */
  lastnameTH:	string,
  /** University email address */
  email:	string,
  /** LDAP display string (name, faculty, employee no.) */
  gecos:	string,
  /**	"student", "faculty", or both */
  roles:	string[],
  /** Organizational unit / employee number (may be null) */
  ouid:	string,
  /** True if the account has been disabled */
  disable:	boolean,
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  let user;
  try { ({ data: { user } } = await supabase.auth.getUser()); }
  catch { return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 }); }
  const url = new URL(request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return authErrorResponse("start_failed");
  try {
    const headers = new Headers();
    headers.append("DeeAppId", getChulaSSOAppId());
    headers.append("DeeAppSecret", getChulaSSOAppSecret());
    headers.append("DeeTicket", ticket);
    const f = await fetch("https://account.it.chula.ac.th/serviceValidation", { headers });
    if (f.ok) {
      const profile: ProfilePayload = await f.json();
      const destination = new URL("/welcome", getSiteUrl());
      const response = NextResponse.redirect(destination);
      const { url: supabaseUrl, key } = getPublicSupabaseEnvironment();
      const supabase = createServerClient(supabaseUrl, key, {
        global: { fetch: createBoundedFetch() },
        cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) }
      });
      const data = {
        cu_uid: profile.uid,
        cu_username: profile.username,
        cu_firstname: profile.firstname,
        cu_lastname: profile.lastname,
        cu_firstnameTH: profile.firstnameTH,
        cu_lastnameTH: profile.lastnameTH,
        cu_email: profile.email,
        cu_gecos: profile.gecos,
        cu_roles: profile.roles,
        cu_ouid: profile.ouid,
        cu_disable: profile.disable
      };
      if (user) {
        const { error } = await supabase.auth.updateUser({ data });

        if (error) {
          console.error("profile_update_failed", {
            errorCode: error.code ?? null,
            status: error.status ?? null,
          });
          return authErrorResponse("session_exchange_failed");
        }

        return response;
      }

      const { data: linkData, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: profile.email,
        options: {
          redirectTo: `${getSiteUrl()}/welcome`,
          data,
        },
      });

      if (error || !linkData.properties?.action_link) {
        console.error("oauth_session_exchange_failed", {
          errorCode: error?.code ?? null,
          status: error?.status ?? null,
        });
        return authErrorResponse("session_exchange_failed");
      }

      return NextResponse.redirect(linkData.properties.action_link);

    } else {
      return authErrorResponse("provider_error")
    }
  } catch {
    return authErrorResponse("start_failed");
  }
}
