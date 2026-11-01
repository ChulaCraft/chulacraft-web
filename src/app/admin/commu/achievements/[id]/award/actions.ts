"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_CSV_ROWS, parseAwardCsv, toAwardKind } from "@/lib/award-csv";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { AWARD_PAGE_SIZE, MAX_SELECT_ALL, selectionIds } from "../../selection";

function awardId(formData: FormData) {
  const id = String(formData.get("achievementId") ?? "");
  return UUID.test(id) ? id : null;
}

/** Keeps a checkbox list from carrying the same player twice. */
function unique(values: string[]) {
  return [...new Set(values)];
}

export type AwardPlayer = { id: string; name: string; minecraft: string };

/** One page of players for the typed filter; the picker pages with `offset`. */
export async function loadAwardPlayers(query: string, offset: number): Promise<{ rows: AwardPlayer[]; total: number } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_players", {
    p_query: query.trim(), p_offset: Math.max(0, Math.floor(offset) || 0), p_limit: AWARD_PAGE_SIZE
  });
  if (error) return { error: dbErrorCode(error) ?? "FAILED" };
  return {
    rows: data.map((row) => ({ id: row.user_id, name: row.display_name || row.email || row.user_id, minecraft: row.minecraft_usernames ?? "" })),
    total: Number(data[0]?.total ?? 0)
  };
}

/** Every player the filter matches, for "Select all filtered". */
export async function listFilteredIds(query: string): Promise<{ ids: string[]; capped: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_player_ids", { p_query: query.trim() });
  if (error) return { error: dbErrorCode(error) ?? "FAILED" };
  const ids = data ?? [];
  return { ids, capped: ids.length >= MAX_SELECT_ALL };
}

export type AwardPreview = {
  kind: string;
  matched: { value: string; userId: string }[];
  unmatched: string[];
  duplicates: string[];
};

/** Turns the pasted list into accounts so the picker can tick them. Nothing is written. */
export async function previewAward(selectedKind: string, csv: string): Promise<AwardPreview | { error: string }> {
  const parsed = parseAwardCsv(csv);
  const kind = parsed.header ?? toAwardKind(selectedKind) ?? "discord";
  if (parsed.values.length > MAX_CSV_ROWS) return { error: "TOO_MANY" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_resolve_identifiers", { p_kind: kind, p_values: parsed.values });
  if (error) return { error: dbErrorCode(error) ?? "FAILED" };

  const matched: AwardPreview["matched"] = [];
  const unmatched: string[] = [];
  for (const row of data ?? []) {
    if (row.user_id) matched.push({ value: row.value, userId: row.user_id });
    else unmatched.push(row.value);
  }
  return { kind, matched, unmatched, duplicates: parsed.duplicates };
}

/** D7: interest is a maybe. The ids are only ticked; the admin still decides who came. */
export async function prefillInterested(eventId: string): Promise<{ ids: string[] } | { error: string }> {
  if (!UUID.test(eventId)) return { error: "PICK_EVENT" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_event_interests", { p_event_id: eventId });
  if (error) return { error: dbErrorCode(error) ?? "FAILED" };
  return { ids: unique((data ?? []).map((row) => row.user_id)) };
}

export async function confirmAward(formData: FormData) {
  const id = awardId(formData);
  if (!id) redirect("/admin/commu/achievements");

  const eventRaw = String(formData.get("eventId") ?? "");
  // Ticked players and the CSV rows that resolved, deduped: found twice is
  // still one award.
  const ids = unique([
    ...selectionIds(String(formData.get("sel") ?? "")),
    ...formData.getAll("matchedId").map(String)
  ]).filter((value) => UUID.test(value));
  if (ids.length === 0) redirect(`/admin/commu/achievements/${id}/award?error=NO_PLAYERS`);

  const raw = String(formData.get("awardedOn") ?? "").trim();
  const supabase = await createClient();
  const { data: added, error } = await supabase.rpc("admin_award", {
    p_achievement_id: id,
    // The generated type does not mark the two optional arguments as nullable.
    p_event_id: (UUID.test(eventRaw) ? eventRaw : null)!,
    // Only read when no event is chosen: the event's own date wins (20261006000001:254-259).
    p_awarded_on: (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }))!,
    p_user_ids: ids
  });

  revalidatePath("/admin/commu/achievements");
  revalidatePath(`/admin/commu/achievements/${id}`);
  if (error) redirect(`/admin/commu/achievements/${id}/award?error=${dbErrorCode(error) ?? "FAILED"}`);
  redirect(`/admin/commu/achievements/${id}/award?done=awarded&count=${added ?? 0}`);
}