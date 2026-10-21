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
