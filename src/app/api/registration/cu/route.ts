import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  let user;
  try { ({ data: { user } } = await supabase.auth.getUser()); }
  catch { return NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 }); }
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  let data;
  try {
    let error;
    ({ data, error } = await supabase.from("cu_registrations")
        .select("*").eq("sp_user_id", user.id).maybeSingle());
    if (error) throw new Error();
  } catch {
    return NextResponse.json({ error: "Could not load registration." }, { status: 503 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  return NextResponse.json({error: "Method Not Allowed"}, {status: 405});
}
