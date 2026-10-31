"use server";

import { redirect } from "next/navigation";
import { type SettingKind, validateSettingValue } from "@/lib/bot-admin";
import { dbErrorCode } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";

const KEY = /^[a-z][a-z0-9_]{1,63}$/;
const KINDS = new Set<string>(["guild", "channel", "role", "role_list", "user_list", "url", "number", "boolean", "text", "text_list"]);
const limit = (v: FormDataEntryValue | null) => (v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

/** Save or reset (blank value) one bot setting. The form's kind/min/max only
 *  word the error early; admin_set_bot_setting checks again and has the last say. */
export async function saveBotSetting(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  if (!KEY.test(key)) redirect("/admin/ops/bot");
  const back = (query: string) => redirect(`/admin/ops/bot?${query}&key=${key}#setting-${key}`);
  const reset = formData.get("reset") === "1";
  const kind = String(formData.get("kind") ?? "");
  let value: string | null = null;
  if (!reset) {
    const checked = KINDS.has(kind)
      ? validateSettingValue(kind as SettingKind, String(formData.get("value") ?? ""), { min: limit(formData.get("min")), max: limit(formData.get("max")) })
      : { ok: true as const, value: String(formData.get("value") ?? "").trim() || null };
    if (!checked.ok) back("error=INVALID");
    else value = checked.value;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_bot_setting", { p_key: key, p_value: value as string });
  back(error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${value === null ? "reset" : "saved"}`);
}

/** Pause or resume one task. */
export async function setBotJobEnabled(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const enabled = String(formData.get("enabled") ?? "");
  if (!KEY.test(name) || (enabled !== "true" && enabled !== "false")) redirect("/admin/ops/bot");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_bot_job_enabled", { p_name: name, p_enabled: enabled === "true" });
  redirect(`/admin/ops/bot?${error ? `jobError=${dbErrorCode(error) ?? "FAILED"}` : `jobDone=${enabled === "true" ? "resumed" : "paused"}`}&job=${name}`);
}
