"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

// The RPCs decide every outcome; these actions only forward the request and
// hand the page a known error code. A malformed id never reaches the database,
// so a tampered form cannot probe for one.

function playerId(formData: FormData, field = "playerId") {
  const value = String(formData.get(field) ?? "");
  return UUID.test(value) ? value : null;
}

function finish(id: string, error: { message: string } | null, done: string) {
  const back = `/player/${id}`;
  // Both the target profile and the dashboard's own lists change when a
  // friendship does, so both are invalidated before the redirect.
  revalidatePath(back);
  revalidatePath("/dashboard");
  redirect(`${back}?${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${done}`}`);
}

export async function sendFriendRequest(formData: FormData) {
  const id = playerId(formData);
  if (!id) redirect("/players");
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_friend_request", { p_other: id });
  finish(id, error, "requested");
}

export async function respondFriendRequest(formData: FormData) {
  const id = playerId(formData, "requesterId");
  if (!id) redirect("/players");
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_friend_request", {
    p_requester: id,
    p_accept: formData.get("accept") === "true"
  });
  // Declining drops the friendship, so the button is gone afterwards either way.
  finish(id, error, formData.get("accept") === "true" ? "accepted" : "declined");
}

export async function removeFriend(formData: FormData) {
  const id = playerId(formData);
  if (!id) redirect("/players");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_friend", { p_other: id });
  finish(id, error, "removed");
}

export async function blockPlayer(formData: FormData) {
  const id = playerId(formData);
  if (!id) redirect("/players");
  const supabase = await createClient();
  const { error } = await supabase.rpc("block_player", { p_other: id });
  finish(id, error, "blocked");
}
export async function reportPlayer(formData: FormData) {
  const id = playerId(formData);
  if (!id) redirect("/players");
  const evidence = String(formData.get("evidenceUrl") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_player", {
    p_target: id,
    p_category: String(formData.get("category") ?? ""),
    p_details: String(formData.get("details") ?? ""),
    p_evidence_url: evidence || undefined
  });
  finish(id, error, "reported");
}
