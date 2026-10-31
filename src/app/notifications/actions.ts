"use server";

import { createClient } from "@/lib/supabase/server";

export type NotificationItem = { id: string; kind: string; payload: unknown; created_at: string; read_at: string | null };
type OpenNotificationsResult =
  | { ok: true; items: NotificationItem[] }
  | { ok: false; error: "UNAUTHENTICATED" | "FAILED" };

/** Loads the caller's latest notifications, then marks them all read. The
 *  list is read first so the items still carry their unread state; if the
 *  mark fails the list is still shown and the next open retries. */
export async function openNotifications(): Promise<OpenNotificationsResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "UNAUTHENTICATED" };

  const { data, error } = await supabase.rpc("my_notifications", { p_limit: 20 });
  if (error) return { ok: false, error: "FAILED" };
  await supabase.rpc("mark_my_notifications_read");
  return { ok: true, items: data ?? [] };
}
