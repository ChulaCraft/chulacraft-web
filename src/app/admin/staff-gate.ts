import { notFound } from "next/navigation";
import { cache } from "react";
import { staffCan, type Area } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

/** The caller's role, fetched once per request however many layouts ask. */
export const myRole = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_app_role");
  return (data as string | null) ?? null;
});

/** Section layouts call this so a moderator who types /admin/ops gets a 404,
 *  not a page of FORBIDDEN errors. The RPCs still check on their own. */
export async function requireArea(area: Area) {
  if (!staffCan(await myRole(), area)) notFound();
}
