"use server";

import { redirect } from "next/navigation";
import { classifyIdentities, identityEmail } from "@/lib/chula";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Only the personal Google account can be unlinked here; Discord and the
// Chula account are looked up from the session, never from the form.
export async function unlinkPersonalGoogle(formData: FormData) {
  const identityId = String(formData.get("identityId"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUserIdentities();
  const identity = error ? undefined : classifyIdentities(data.identities).personal.find((i) => i.identity_id === identityId);
  if (!identity) redirect("/dashboard?error=unlink_failed");

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) redirect("/dashboard?error=unlink_failed");
  await createAdminClient().rpc("log_identity_change", {
    p_user_id: identity.user_id, p_identity_id: identity.identity_id, p_field: "google", p_old: identityEmail(identity), p_new: null
  });
  redirect("/dashboard?unlinked=1");
}
