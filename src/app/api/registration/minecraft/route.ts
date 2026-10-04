import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isValidMinecraftUsername, normalizeMinecraftUsername, REGISTRATION_COLUMNS, registrationError, toRegistrationView, UUID, type RegistrationRow } from "@/lib/registration";

export const runtime = "nodejs";

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
  return save(request, (profile, _id, userId) => [
    "add_minecraft_account", { p_user_id: userId, p_minecraft_uuid: profile.uuid, p_minecraft_username: profile.username }
  ]);
}

/** Change an existing account's name (pen → Save). */
export async function PATCH(request: Request) {
  return save(request, (profile, id, userId) => {
    if (typeof id !== "string" || !UUID.test(id)) return null;
    return ["change_minecraft_account", { p_user_id: userId, p_registration_id: id, p_minecraft_uuid: profile.uuid, p_minecraft_username: profile.username }];
  });
}

/** Remove an account from the player's list (soft delete, also un-whitelists). */
export async function DELETE(request: Request) {
  const { user, failure } = await signedIn();
  if (failure) return failure;
  let id: unknown;
  try { ({ id } = await request.json() as { id?: unknown }); } catch { /* handled below */ }
  if (typeof id !== "string" || !UUID.test(id)) return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 });
  let error;
  try { ({ error } = await createAdminClient().rpc("remove_minecraft_account", { p_user_id: user.id, p_registration_id: id })); }
  catch { return NextResponse.json({ error: "We couldn’t remove that account. Please try again." }, { status: 503 }); }
  if (error) {
    const failure = registrationError(error.message, error.code);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  return new NextResponse(null, { status: 204 });
}

type Profile = { uuid: string; username: string };
type SaveRpc =
  | ["add_minecraft_account", { p_user_id: string; p_minecraft_uuid: string; p_minecraft_username: string }]
  | ["change_minecraft_account", { p_user_id: string; p_registration_id: string; p_minecraft_uuid: string; p_minecraft_username: string }];

async function save(request: Request, toRpc: (profile: Profile, id: unknown, userId: string) => SaveRpc | null) {
  const { supabase, user, failure } = await signedIn();
  if (failure) return failure;
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

  const call = toRpc(profile, id, user.id);
  if (!call) return NextResponse.json({ error: "Send a valid registration request." }, { status: 400 });
  const [fn, args] = call;

  // The account RPCs are service-role only so players can't skip the Mojang lookup above.
  const admin = createAdminClient();
  let data: (RegistrationRow & { created?: boolean })[] | null;
  let error: { message: string; code?: string } | null;
  try {
    // The two RPCs differ only by name and one arg, so the call is split rather
    // than spread: supabase-js types each overload separately.
    const result = fn === "add_minecraft_account"
      ? await admin.rpc("add_minecraft_account", args as { p_user_id: string; p_minecraft_uuid: string; p_minecraft_username: string })
      : await admin.rpc("change_minecraft_account", args as { p_user_id: string; p_registration_id: string; p_minecraft_uuid: string; p_minecraft_username: string });
    data = result.data;
    error = result.error;
  }
  catch { return NextResponse.json({ error: "We couldn’t save the registration. Please try again." }, { status: 503 }); }
  if (error) {
    const failure = registrationError(error.message, error.code);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  const registration = data?.[0];
  if (!registration) return NextResponse.json({ error: "We couldn’t save the registration. Please try again." }, { status: 503 });
  return NextResponse.json({ registration: toRegistrationView(registration) }, { status: "created" in registration && registration.created ? 201 : 200 });
}
