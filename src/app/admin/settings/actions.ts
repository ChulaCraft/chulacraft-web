"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { SETTING_DEFAULTS, SETTING_KEYS } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";

const SWITCHES = new Set(["registration_open", "reports_open"]);

/** Every key, every time. The form starts filled with what the site shows now,
 *  so a value left equal to the built-in default (or emptied) is sent empty:
 *  that clears the row, and a later change to the default still reaches the
 *  site. The database validates each value (20261025000001). */
export async function saveSiteSettings(formData: FormData) {
  const settings = Object.fromEntries(SETTING_KEYS.map((key) => {
    const value = SWITCHES.has(key) ? String(formData.get(key) === "on") : String(formData.get(key) ?? "").trim();
    return [key, value === SETTING_DEFAULTS[key] ? "" : value];
  }));
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_site_settings", { p_settings: settings });
  // Header, footer links and homepage all read these.
  revalidatePath("/", "layout");
  redirect(`/admin/settings?${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : "done=saved"}`);
}

/** The allowlist of Discord roles a badge may give (20261026000001). The RPCs
 *  own the format and the IN_USE check; these only forward and report. */
function finishRole(error: { message: string } | null, done: string) {
  revalidatePath("/admin/settings");
  revalidatePath("/admin/commu/achievements", "layout");
  redirect(`/admin/settings?${error ? `roleError=${dbErrorCode(error) ?? "FAILED"}` : `role=${done}`}#discord-roles`);
}

export async function saveDiscordRole(formData: FormData) {
  const roleId = String(formData.get("roleId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!/^[0-9]{17,20}$/.test(roleId) || !label || label.length > 60) finishRole({ message: "INVALID" }, "saved");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_discord_role", { p_role_id: roleId, p_label: label });
  finishRole(error, "saved");
}

export async function deleteDiscordRole(formData: FormData) {
  const roleId = String(formData.get("roleId") ?? "");
  if (!/^[0-9]{17,20}$/.test(roleId)) finishRole({ message: "INVALID" }, "removed");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_discord_role", { p_role_id: roleId });
  finishRole(error, "removed");
}
