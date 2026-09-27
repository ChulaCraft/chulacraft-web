import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for signed-in pages: signed out → "/", no Discord base → error,
 * not Chula-verified → "/verify". Returns null when Supabase is unreachable
 * so the page can render its unavailable state.
 */
export async function requireVerifiedUser() {
  const supabase = await createClient();
  let user;
  let verified;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
    if (user) {
      const { data, error } = await supabase.rpc("am_i_chula_verified");
      if (error) return null;
      verified = data === true;
    }
  } catch {
    return null;
  }
  if (!user) redirect("/");
  if (user.identities?.filter((i) => i.provider === "discord").length !== 1) redirect("/auth/error?reason=discord_required");
  if (!verified) redirect("/verify");
  return { supabase, user };
}
