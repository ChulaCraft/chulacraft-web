"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MAX_CSV_ROWS, parseAwardCsv, toAwardKind } from "@/lib/award-csv";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { selectionIds, selectionParam } from "../../selection";

function awardId(formData: FormData) {
  const id = String(formData.get("achievementId") ?? "");
  return UUID.test(id) ? id : null;
}

/** Keeps a checkbox list from carrying the same player twice. */
function unique(values: string[]) {
  return [...new Set(values)];
}

function fail(achievementId: string, code: string, query: URLSearchParams): never {
  query.set("error", code);
  query.delete("preview");
  redirect(`/admin/achievements/${achievementId}/award?${query}`);
}

/** Search results are ticked with checkboxes; this adds them to whatever is
 *  already selected rather than replacing it. */
export async function addPlayers(formData: FormData) {
  const id = awardId(formData);
  if (!id) redirect("/admin/achievements");
  const query = new URLSearchParams();
  const search = String(formData.get("q") ?? "").trim();
  if (search) query.set("q", search);
  const ticked = unique([...selectionIds(String(formData.get("sel") ?? "")), ...formData.getAll("playerId").map(String)]).filter((value) => UUID.test(value));
  if (ticked.length) query.set("sel", selectionParam(ticked));
  redirect(`/admin/achievements/${id}/award?${query}`);
}

/** Turns the pasted list into accounts, then shows what matched before
 *  anything is written. */
export async function previewAward(formData: FormData) {
  const id = awardId(formData);
  if (!id) redirect("/admin/achievements");

  const csv = String(formData.get("csv") ?? "");
  const parsed = parseAwardCsv(csv);
  const kind = parsed.header ?? toAwardKind(String(formData.get("kind") ?? "")) ?? "discord";

  const query = new URLSearchParams();
  const ticked = selectionIds(String(formData.get("sel") ?? ""));
  if (ticked.length) query.set("sel", selectionParam(ticked));
  if (parsed.values.length > MAX_CSV_ROWS) fail(id, "TOO_MANY", query);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_resolve_identifiers", { p_kind: kind, p_values: parsed.values });
  if (error) fail(id, dbErrorCode(error) ?? "FAILED", query);

  const preview = new URLSearchParams({ kind, csv });
  for (const row of data ?? []) {
    if (row.user_id) preview.append("matched", `${row.value}|${row.user_id}`);
    else preview.append("unmatched", row.value);
  }
  for (const value of parsed.duplicates) preview.append("duplicate", value);
  query.set("preview", preview.toString());
  redirect(`/admin/achievements/${id}/award?${query}`);
}

export async function prefillInterested(formData: FormData) {
  const id = awardId(formData);
  if (!id) redirect("/admin/achievements");

  const eventRaw = String(formData.get("eventId") ?? "");
  const query = new URLSearchParams();
  const search = String(formData.get("q") ?? "").trim();
  if (search) query.set("q", search);
  if (!UUID.test(eventRaw)) {
    // Nothing chosen means nothing to prefill from; send the admin back with a
    // code the page turns into copy rather than silently doing nothing.
    query.set("error", "PICK_EVENT");
    redirect(`/admin/achievements/${id}/award?${query}`);
  }
  query.set("eventId", eventRaw);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_event_interests", { p_event_id: eventRaw });
  if (error) {
    query.set("error", dbErrorCode(error) ?? "FAILED");
    redirect(`/admin/achievements/${id}/award?${query}`);
  }

  // D7: interest is a maybe. Ticked, not awarded — the confirm step still runs
  // and the admin still decides who actually came.
  const ticked = unique([...selectionIds(String(formData.get("sel") ?? "")), ...(data ?? []).map((row) => row.user_id)]);
  if (ticked.length) query.set("sel", selectionParam(ticked));
  redirect(`/admin/achievements/${id}/award?${query}`);
}

export async function confirmAward(formData: FormData) {
  const id = awardId(formData);
  if (!id) redirect("/admin/achievements");

  const eventRaw = String(formData.get("eventId") ?? "");
  // Ticked players and the CSV rows that resolved, deduped: found twice is
  // still one award.
  const ids = unique([
    ...selectionIds(String(formData.get("sel") ?? "")),
    ...formData.getAll("matchedId").map(String)
  ]).filter((value) => UUID.test(value));
  if (ids.length === 0) redirect(`/admin/achievements/${id}/award?error=NO_PLAYERS`);

  const raw = String(formData.get("awardedOn") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_award", {
    p_achievement_id: id,
    // The generated type does not mark the two optional arguments as nullable.
    p_event_id: (UUID.test(eventRaw) ? eventRaw : null)!,
    // Only read when no event is chosen: the event's own date wins (20261006000001:254-259).
    p_awarded_on: (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }))!,
    p_user_ids: ids
  });

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);
  if (error) redirect(`/admin/achievements/${id}/award?error=${dbErrorCode(error) ?? "FAILED"}`);
  redirect(`/admin/achievements/${id}/award?done=awarded&count=${ids.length}`);
}