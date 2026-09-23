"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { openPendingLink, PENDING_LINK_COOKIE } from "@/lib/cusso/pending";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Server actions only accept same-origin POSTs, so reaching this means the
// signed-in user pressed Confirm on our own page.
export async function confirmLink() {
  const cookieStore = await cookies();
  const pending = openPendingLink(cookieStore.get(PENDING_LINK_COOKIE)?.value);
  cookieStore.set(PENDING_LINK_COOKIE, "", { path: "/auth/cusso/confirm", maxAge: 0 });

  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!pending || !user || pending.userId !== user.id) redirect("/auth/error?reason=start_failed");

  const { error } = await createAdminClient().rpc("link_cu_sso", {
    p_user_id: user.id,
    p_chula_uid: pending.uid,
    p_chula_username: pending.username,
    p_email: pending.email,
    p_display_name: pending.displayName
  });
  if (error) redirect(`/auth/error?reason=${error.message.includes("CU_ALREADY_LINKED") ? "cu_already_linked" : "other"}`);
  redirect("/dashboard?linked=cu");
}
