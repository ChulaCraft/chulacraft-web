"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { checkInPath, COOKIE_BASE, NEXT_COOKIE, PROOF_COOKIE } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/** The only place a player's own scan is recorded: a POST from the button,
 *  never the GET that opened the page. The proof comes from the httpOnly
 *  cookie the start route set, never from the form. */
export async function checkIn(formData: FormData) {
  const value = String(formData.get("eventId") ?? "");
  if (!UUID.test(value)) redirect("/");
  const page = checkInPath(value);

  const supabase = await createClient();
  let user: { id: string } | null = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    redirect(`${page}?error=FAILED`);
  }
  if (!user) redirect("/register");

  const store = await cookies();
  const proof = store.get(PROOF_COOKIE)?.value;
  if (!proof) redirect(`${page}?error=TOKEN_EXPIRED`);

  const { data, error } = await supabase.rpc("check_in", { p_event_id: value, p_token: proof });
  const code = error ? dbErrorCode(error) ?? "FAILED" : null;
  const cleared = { ...COOKIE_BASE, maxAge: 0 };
  // A proof is single use from here on; only an unexpected failure keeps it
  // so pressing again within its 5 minutes can still work.
  if (code !== "FAILED") store.set(PROOF_COOKIE, "", { ...cleared, path: page });
  store.set(NEXT_COOKIE, "", { ...cleared, path: "/" });

  if (code) redirect(`${page}?error=${code}`);
  redirect(`${page}?done=${data === "already" ? "already" : "recorded"}`);
}
