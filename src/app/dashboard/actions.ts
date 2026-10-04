"use server";

import { redirect } from "next/navigation";
import { classifyIdentities, identityEmail } from "@/lib/chula";
import { identityChange } from "@/lib/reconcile-identities";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Only the personal Google account can be unlinked here; Discord and the
// Chula account are looked up from the session, never from the form.
export async function unlinkPersonalGoogle(formData: FormData) {
  const identityId = String(formData.get("identityId"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();
  const { data: userData } = await supabase.auth.getUser();
  if (error || !userData.user) redirect("/dashboard?error=unlink_failed");
  // The claimed Chula account is excluded by google_sub, not by email domain,
  // so an account whose email left the domain can't be unlinked from here.
  // my_chula_claim() hands back only the caller's own row, keyed on the JWT.
  const { data: claim, error: claimError } = await supabase.rpc("my_chula_claim").maybeSingle();
  // Fail closed: without the claim the Chula account could look personal.
  if (claimError) redirect("/dashboard?error=unlink_failed");
  const identity = classifyIdentities(data.identities, claim?.google_sub ?? null).personal.find((i) => i.identity_id === identityId);
  if (!identity) redirect("/dashboard?error=unlink_failed");

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) redirect("/dashboard?error=unlink_failed");
  await createAdminClient().rpc("log_identity_change", identityChange({ user_id: identity.user_id, identity_id: identity.identity_id, field: "google", old: identityEmail(identity), new: null }));
  redirect("/dashboard?unlinked=1");
}
