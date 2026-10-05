import type { SupabaseClient, UserIdentity } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { classifyIdentities, identityEmail, type LinkError } from "@/lib/chula";
import { dbErrorCode } from "@/lib/db-error";

type Outcome = { signOut: true; reason: "discord_required" } | { signOut: false; path: string };

/** The generator types every scalar RPC argument as a non-null string, but
 * log_identity_change writes to nullable old_value/new_value columns, where
 * null is the honest "no value on this side of the change". */
export function identityChange(p: { user_id: string; identity_id: string; field: string; old: string | null; new: string | null }) {
  return {
    p_user_id: p.user_id, p_identity_id: p.identity_id, p_field: p.field,
    p_old: p.old, p_new: p.new
  } as Database["public"]["Functions"]["log_identity_change"]["Args"];
}

/**
 * Runs after every OAuth return (sign-in or link) and on /verify, and enforces
 * the account rules on the session's own identities: exactly one Discord, one
 * claimed Chula Google account, and a personal Google account only once
 * verified (max one). Identities that break a rule are unlinked. The database
 * (is_chula_verified) enforces the same limits, since the browser can link
 * identities without passing through here. Returns where to send the user.
 */
export async function reconcileIdentities(session: SupabaseClient<Database>, admin: SupabaseClient<Database>, userId: string, identities: UserIdentity[]): Promise<Outcome> {
  if (identities.filter((i) => i.provider === "discord").length !== 1) return { signOut: true, reason: "discord_required" };

  const { data: claim, error: claimLookupError } = await admin.from("chula_claims").select("google_sub").eq("user_id", userId).maybeSingle();
  if (claimLookupError) return { signOut: false, path: "/verify?error=other" };
  const { cu, invalid, personal } = classifyIdentities(identities, claim?.google_sub ?? null);
  // The claimed account is always the Chula one, even if its email later changes.
  const claimed = identities.find((i) => i.provider === "google" && i.id === claim?.google_sub);
  const notClaimed = (i: UserIdentity) => i !== claimed;
  const cuIdentities = claimed ? [claimed, ...cu.filter(notClaimed)] : cu;

  let error: LinkError | null = null;
  const unlink = async (identity: UserIdentity, reason: LinkError) => {
    error = reason;
    const { error: unlinkError } = await session.auth.unlinkIdentity(identity);
    if (unlinkError) {
      console.error("identity_unlink_failed", { code: unlinkError.code ?? null });
      return;
    }
    await admin.rpc("log_identity_change", identityChange({ user_id: userId, identity_id: identity.identity_id, field: "google", old: identityEmail(identity), new: null }));
  };

  for (const identity of invalid.filter(notClaimed)) await unlink(identity, "cu_wrong_domain");

  let verified = false;
  let transient = false;
  for (const identity of cuIdentities) {
    const { error: claimError } = await admin.rpc("claim_chula", {
      // claim_chula's p_email is plain text too; null would raise CU_WRONG_DOMAIN
      // just as an empty string would, so the address is passed through as-is.
      p_user_id: userId, p_google_sub: identity.id, p_email: identityEmail(identity) as string
    });
    if (!claimError) { verified = true; continue; }
    const code = dbErrorCode(claimError);
    if (code === "CU_ALREADY_LINKED") await unlink(identity, "cu_already_linked");
    else if (code === "CU_SWAP_FORBIDDEN") await unlink(identity, "cu_swap");
    // Anything else is transient: keep the identity so the next sign-in retries.
    else { transient = true; error = "other"; }
  }

  const extras = personal.filter(notClaimed);
  // A transient claim failure says nothing about the personal account; leave it.
  if (!verified && !transient) {
    for (const identity of extras) await unlink(identity, "cu_wrong_domain");
  } else if (verified) {
    for (const identity of extras.slice(1)) await unlink(identity, "personal_limit");
    if (extras[0]) await logFirstSeen(admin, userId, extras[0]);
  }

  const query = error ? `?error=${error}` : "";
  if (!verified) return { signOut: false, path: `/verify${query}` };
  return { signOut: false, path: error ? `/settings${query}` : "/welcome" };
}

// Audit a personal Google link once, the first time it is seen.
async function logFirstSeen(admin: SupabaseClient<Database>, userId: string, identity: UserIdentity) {
  const { data, error } = await admin.from("account_change_log").select("id")
    .eq("entity", "identities").eq("entity_id", identity.identity_id).limit(1);
  if (error || data?.length) return;
  await admin.rpc("log_identity_change", identityChange({ user_id: userId, identity_id: identity.identity_id, field: "google", old: null, new: identityEmail(identity) }));
}
