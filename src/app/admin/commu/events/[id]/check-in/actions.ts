"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { getSiteUrl } from "@/lib/env";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export type TokenResult = { svg: string; expiresAt: number } | { error: string };
export type ScanResult =
  | { status: "recorded" | "already"; name: string; avatarUrl: string | null }
  | { error: string };

const code = (error: { message: string } | null) => dbErrorCode(error) ?? "FAILED";
const page = (eventId: string) => `/admin/commu/events/${eventId}/check-in`;

/** The QR is drawn here so the client bundle never carries an encoder. It
 *  points at the start route, which trades the token for a 5-minute proof. */
export async function nextToken(eventId: string): Promise<TokenResult> {
  if (!UUID.test(eventId)) return { error: "NOT_FOUND" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_checkin_token", { p_event_id: eventId });
  const row = data?.[0];
  if (error || !row) return { error: error ? code(error) : "FAILED" };
  const url = `${getSiteUrl().replace(/\/+$/, "")}/events/${eventId}/check-in/start?t=${encodeURIComponent(row.token)}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
  return { svg, expiresAt: new Date(row.expires_at).getTime() };
}

/** A player's personal code, typed or scanned. Anything that cannot be one
 *  (the event QR's URL, a typo) is UNKNOWN_CODE without a database call. */
export async function checkInPlayer(eventId: string, raw: string): Promise<ScanResult> {
  if (!UUID.test(eventId)) return { error: "NOT_FOUND" };
  const value = String(raw ?? "").trim().toUpperCase();
  if (!/^CC-[A-Z2-9]{10}$/.test(value)) return { error: "UNKNOWN_CODE" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_check_in_player", { p_event_id: eventId, p_code: value });
  const row = data?.[0];
  if (error || !row) return { error: error ? code(error) : "FAILED" };
  revalidatePath(page(eventId));
  return { status: row.status === "already" ? "already" : "recorded", name: row.display_name, avatarUrl: row.avatar_url };
}

function postedId(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "");
  return UUID.test(value) ? value : null;
}

function finish(eventId: string, error: { message: string } | null, done: string): never {
  revalidatePath(page(eventId));
  redirect(`${page(eventId)}?${error ? `error=${code(error)}` : done}`);
}

export async function removeAttendance(formData: FormData) {
  const eventId = postedId(formData, "eventId");
  if (!eventId) redirect("/admin/commu/events");
  const userId = postedId(formData, "userId");
  if (!userId) finish(eventId, { message: "NOT_FOUND" }, "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_attendance", { p_event_id: eventId, p_user_id: userId });
  finish(eventId, error, "done=removed");
}

export async function awardAttendees(formData: FormData) {
  const eventId = postedId(formData, "eventId");
  if (!eventId) redirect("/admin/commu/events");
  const achievementId = postedId(formData, "achievementId");
  if (!achievementId) finish(eventId, { message: "NO_ACHIEVEMENT" }, "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_award_attendees", { p_event_id: eventId, p_achievement_id: achievementId });
  if (!error) revalidatePath(`/admin/commu/achievements/${achievementId}`);
  finish(eventId, error, `done=awarded&n=${Number(data) || 0}`);
}

/** Every QR shown so far stops working at once; proofs signed with the old
 *  secret fail too. */
export async function resetCode(formData: FormData) {
  const eventId = postedId(formData, "eventId");
  if (!eventId) redirect("/admin/commu/events");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_rotate_checkin_secret", { p_event_id: eventId });
  finish(eventId, error, "done=reset");
}
