import { NextResponse, type NextRequest } from "next/server";
import { DEV_LOGIN_ENABLED, DEV_USERS as USERS } from "@/lib/dev-login";
import { createClient } from "@/lib/supabase/server";

// LOCAL DEV ONLY: one-click sign-in as the users from supabase/dev-seed.sql.

export async function GET(request: NextRequest) {
  const as = request.nextUrl.searchParams.get("as") as keyof typeof USERS | null;
  if (!DEV_LOGIN_ENABLED || !as || !(as in USERS)) return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: USERS[as], password: "dev-password" });
  if (error) return NextResponse.json({ error: error.message, hint: "Run supabase/dev-seed.sql and restart local Supabase" }, { status: 500 });
  return NextResponse.redirect(new URL(as === "admin" || as === "owner" ? "/admin" : "/welcome", request.url));
}
