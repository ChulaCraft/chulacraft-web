"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchHit = { kind: "Player" | "Achievement" | "Event"; label: string; hint: string; href: string };

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" });

/** Ctrl+K search across admin. Every RPC re-checks the role, so a non-admin
 *  just gets nothing back. Catalogs are small, so they're filtered here. */
export async function adminSearch(raw: string): Promise<SearchHit[]> {
  const q = String(raw ?? "").trim().slice(0, 100);
  if (q.length < 2) return [];
  const needle = q.toLowerCase();
  const supabase = await createClient();
  const [players, achievements, events] = await Promise.all([
    supabase.rpc("admin_list_players", { p_query: q, p_limit: 6 }),
    supabase.rpc("admin_list_achievements"),
    supabase.rpc("admin_list_events"),
  ]);
  return [
    ...(players.data ?? []).map((p): SearchHit => ({ kind: "Player", label: p.display_name ?? p.handle, hint: p.handle, href: `/admin/users/${p.user_id}` })),
    ...(achievements.data ?? []).filter((a) => a.name.toLowerCase().includes(needle)).slice(0, 5)
      .map((a): SearchHit => ({ kind: "Achievement", label: a.name, hint: a.status, href: `/admin/commu/achievements/${a.id}` })),
    ...(events.data ?? []).filter((e) => e.name.toLowerCase().includes(needle)).slice(0, 5)
      .map((e): SearchHit => ({ kind: "Event", label: e.name, hint: day(e.starts_at), href: `/admin/commu/events/${e.id}` })),
  ];
}
