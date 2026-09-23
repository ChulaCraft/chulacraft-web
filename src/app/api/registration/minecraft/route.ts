import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidMinecraftUsername, normalizeMinecraftUsername, REGISTRATION_COLUMNS, registrationError, toRegistrationView } from "@/lib/registration";

export const runtime = "nodejs";

const ipAttempts = new Map<string, { count: number; resetsAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** The signed-in user's client, or the response to send when there isn't one. */
async function signedIn() {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { failure: NextResponse.json({ error: "Sign in is required." }, { status: 401 }) };
    return { supabase, user };
  } catch {
    return { failure: NextResponse.json({ error: "Authentication is temporarily unavailable." }, { status: 503 }) };
  }
}

function ipRateLimited(key: string) {
  const now = Date.now();
  const current = ipAttempts.get(key);
  if (!current || current.resetsAt <= now) { ipAttempts.set(key, { count: 1, resetsAt: now + RATE_WINDOW_MS }); return false; }
  if (current.count >= RATE_LIMIT) return true;
  current.count += 1;
  return false;
}

async function resolveMinecraftProfile(username: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(username)}`, { signal: controller.signal, headers: { Accept: "application/json" }, cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("PROFILE_DEPENDENCY");
    const profile = await response.json() as { id?: string; name?: string };
    if (!profile.id || !profile.name || !/^[0-9a-f]{32}$/i.test(profile.id)) throw new Error("PROFILE_INVALID");
    const uuid = `${profile.id.slice(0, 8)}-${profile.id.slice(8, 12)}-${profile.id.slice(12, 16)}-${profile.id.slice(16, 20)}-${profile.id.slice(20)}`;
    return { uuid, username: profile.name };
  } finally { clearTimeout(timeout); }
}

export async function GET() {
  const { supabase, user, failure } = await signedIn();
  if (failure) return failure;
  let data;
  try {
    let error;
    ({ data, error } = await supabase.from("minecraft_registrations")
        .select(REGISTRATION_COLUMNS)
        .eq("user_id", user.id).eq("is_active", true).order("created_at"));
    if (error) throw new Error(error.message);
  } catch {
    return NextResponse.json({ error: "Could not load registrations." }, { status: 503 });
  }
  return NextResponse.json({ registrations: (data ?? []).map(toRegistrationView) });
}

/** Add a new Minecraft account (+ button). */
export async function POST(request: Request) {
  return save(request, (profile) => ["add_minecraft_account", { p_minecraft_uuid: profile.uuid, p_minecraft_username: profile.username }]);
}

/** Change an existing account's name (pen → Save). */
export async function PATCH(request: Request) {
  return save(request, (profile, id) => {
    if (typeof id !== "string") return null;
    return ["change_minecraft_account", { p_registration_id: id, p_minecraft_uuid: profile.uuid, p_minecraft_username: profile.username }];
  });
}

/** Remove an account from the player's list (soft delete, also un-whitelists). */
export async function DELETE(request: Request) {
  const { supabase, failure } = await signedIn();
  if (failure) return failure;
  let id: unknown;
  try { ({ id } = await request.json() as { id?: unknown }); } catch { /* handled below */ }
  if (typeof id !== "string") return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 });
  let error;
  try { ({ error } = await supabase.rpc("remove_minecraft_account", { p_registration_id: id })); }
  catch { return NextResponse.json({ error: "We couldn’t remove that account. Please try again." }, { status: 503 }); }
  if (error) {
    const failure = registrationError(error.message, error.code);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  return new NextResponse(null, { status: 204 });
}

type Profile = { uuid: string; username: string };
type RpcCall = [string, Record<string, unknown>];

async function save(request: Request, toRpc: (profile: Profile, id: unknown) => RpcCall | null) {
  const { supabase, failure } = await signedIn();
  if (failure) return failure;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (ipRateLimited(`ip:${forwardedFor}`)) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  let allowed: boolean | null;
  try {
    const { data, error } = await supabase.rpc("consume_registration_attempt");
    if (error) return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again." }, { status: 503 });
    allowed = data;
  } catch { return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again." }, { status: 503 }); }
  if (!allowed) return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });

  let rawUsername: unknown;
  let id: unknown;
  try { ({ minecraftUsername: rawUsername, id } = await request.json() as { minecraftUsername?: unknown; id?: unknown }); } catch { return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 }); }
  if (typeof rawUsername !== "string" || !isValidMinecraftUsername(rawUsername)) return NextResponse.json({ error: "Enter 3–16 letters, numbers, or underscores." }, { status: 400 });

  let profile: Profile | null;
  try { profile = await resolveMinecraftProfile(normalizeMinecraftUsername(rawUsername)); } catch { return NextResponse.json({ error: "Minecraft profile lookup is temporarily unavailable. Please try again." }, { status: 503 }); }
  if (!profile) return NextResponse.json({ error: "We couldn’t find that Minecraft Java Edition profile." }, { status: 400 });

  const call = toRpc(profile, id);
  if (!call) return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 });

  let data;
  let error;
  try { ({ data, error } = await supabase.rpc(...call)); }
  catch { return NextResponse.json({ error: "We couldn’t save the registration. Please try again." }, { status: 503 }); }
  if (error) {
    const failure = registrationError(error.message, error.code);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  const registration = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ registration: toRegistrationView(registration as Record<string, unknown>) }, { status: registration?.created ? 201 : 200 });
}
