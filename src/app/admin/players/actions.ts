"use server";

import { revalidatePath } from "next/cache";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import type { RawParams } from "@/lib/table-query";
import { PAGE_SIZE, readPlayers, rpcArgs } from "./params";

export async function loadPlayers(search: RawParams, offset: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_players", {
    ...rpcArgs(readPlayers(search)), p_offset: Math.max(0, Math.floor(offset) || 0), p_limit: PAGE_SIZE,
  });
  if (error) return { error: true as const };
  return { rows: data, total: Number(data[0]?.total ?? 0) };
}

const MAX_BULK = 200;
export type BulkResult = { done: number; skipped: { id: string; code: string }[] } | { error: "INVALID" | "TOO_MANY" };

// One RPC per player on purpose: each call re-applies that RPC's role rules
// (admins can't touch admins, no self-ban), so bulk can't do more than single.
async function each(ids: string[], call: (id: string) => PromiseLike<{ error: { message: string } | null }>): Promise<BulkResult> {
  if (ids.length > MAX_BULK) return { error: "TOO_MANY" };
  if (ids.length === 0 || !ids.every((id) => UUID.test(id))) return { error: "INVALID" };
  const unique = [...new Set(ids)];
  const skipped: { id: string; code: string }[] = [];
  for (const id of unique) {
    try {
      const { error } = await call(id);
      if (error) skipped.push({ id, code: dbErrorCode(error) ?? "FAILED" });
    } catch {
      skipped.push({ id, code: "FAILED" });
    }
  }
  revalidatePath("/admin/players");
  return { done: unique.length - skipped.length, skipped };
}

export async function bulkMarkGuest(ids: string[]): Promise<BulkResult> {
  const supabase = await createClient();
  return each(ids, (id) => supabase.rpc("admin_mark_guest", { p_user_id: id }));
}

export async function bulkBan(ids: string[], reason: string): Promise<BulkResult> {
  const text = reason.trim();
  if (!text) return { error: "INVALID" };
  const supabase = await createClient();
  return each(ids, (id) => supabase.rpc("admin_ban_user", { p_user_id: id, p_reason: text }));
}
