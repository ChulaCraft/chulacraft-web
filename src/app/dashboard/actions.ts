"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { classifyIdentities, identityEmail } from "@/lib/chula";
import { dbErrorCode } from "@/lib/db-error";
import { identityChange } from "@/lib/reconcile-identities";
import { UUID } from "@/lib/registration";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Only the personal Google account can be unlinked here; Discord and the
// Chula account are looked up from the session, never from the form.
export async function unlinkPersonalGoogle(formData: FormData) {
  const identityId = String(formData.get("identityId"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();
  const { data: userData } = await supabase.auth.getUser();
  if (error || !userData.user) redirect("/settings?error=unlink_failed");
  // The claimed Chula account is excluded by google_sub, not by email domain,
  // so an account whose email left the domain can't be unlinked from here.
  // my_chula_claim() hands back only the caller's own row, keyed on the JWT.
  const { data: claim, error: claimError } = await supabase.rpc("my_chula_claim").maybeSingle();
  // Fail closed: without the claim the Chula account could look personal.
  if (claimError) redirect("/settings?error=unlink_failed");
  const identity = classifyIdentities(data.identities, claim?.google_sub ?? null).personal.find((i) => i.identity_id === identityId);
  if (!identity) redirect("/settings?error=unlink_failed");

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) redirect("/settings?error=unlink_failed");
  await createAdminClient().rpc("log_identity_change", identityChange({ user_id: identity.user_id, identity_id: identity.identity_id, field: "google", old: identityEmail(identity), new: null }));
  redirect("/settings?unlinked=1");
}

// ------------------------------------------------------- Phase B: the socials
//
// The RPCs own every rule (who may befriend whom, what a level means); these
// actions only forward the request and hand the page a known error code. Ids
// are checked here so a malformed form never reaches the database, and the
// caller is always the session user, never a field.

/** Friends live on /dashboard, privacy on /settings; each action lands back
 *  on its own page. Both pages are revalidated with /players: a friendship
 *  or a privacy change alters what the other player sees. */
function finish(error: { message: string } | null, done: string, page: "/dashboard" | "/settings" = "/dashboard") {
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/players");
  redirect(`${page}?${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${done}`}`);
}

function otherId(formData: FormData) {
  const value = String(formData.get("otherId") ?? "");
  return UUID.test(value) ? value : null;
}

export async function respondFriendRequest(formData: FormData) {
  const id = otherId(formData);
  if (!id) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_friend_request", {
    p_requester: id,
    p_accept: formData.get("accept") === "true"
  });
  finish(error, formData.get("accept") === "true" ? "accepted" : "declined");
}

export async function removeFriend(formData: FormData) {
  const id = otherId(formData);
  if (!id) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_friend", { p_other: id });
  finish(error, "removed");
}

export async function unblockPlayer(formData: FormData) {
  const id = otherId(formData);
  if (!id) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.rpc("unblock_player", { p_other: id });
  finish(error, "unblocked");
}

const LEVELS = ["public", "friends", "private"] as const;

/** The four selects are saved together: the database enforces that the most
 *  restrictive of profile and field wins, so a form that only sent one would
 *  leave the page disagreeing with the RPC. */
export async function updatePrivacy(formData: FormData) {
  const levels = ["profile", "minecraft", "achievements", "friends"].map((field) => String(formData.get(field) ?? ""));
  if (!levels.every((level) => (LEVELS as readonly string[]).includes(level))) redirect("/settings");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_privacy", {
    p_profile: levels[0],
    p_minecraft: levels[1],
    p_achievements: levels[2],
    p_friends: levels[3]
  });
  finish(error, "privacy", "/settings");
}
