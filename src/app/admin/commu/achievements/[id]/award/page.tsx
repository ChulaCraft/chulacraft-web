import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { MAX_CSV_ROWS } from "@/lib/award-csv";
import { fetchAllRpc } from "@/lib/admin-export";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { selectionIds } from "../../selection";
import { timed } from "@/lib/perf";
import { loadAwardPlayers } from "./actions";
import { AwardList } from "./award-list";

export const metadata: Metadata = { title: "Award achievement" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to award this.",
  NOT_FOUND: "That achievement or event no longer exists. Refresh and try again.",
  TOO_MANY: `That list has more than ${MAX_CSV_ROWS} rows. Split it into smaller lists.`,
  NO_PLAYERS: "Pick at least one player first.",
  FAILED: "The award couldn't be saved. Please try again."
};

export default async function AdminAwardPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string; count?: string; sel?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done, count, sel } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [catalog, events, first] = await Promise.all([
    timed("admin_list_achievements", supabase.rpc("admin_list_achievements")),
    timed("admin_list_events", supabase.rpc("admin_list_events")),
    loadAwardPlayers("", 0)
  ]);
  const achievement = (catalog.data ?? []).find((row) => row.id === id);
  if (!achievement) notFound();

  const recipients: string[] = [];
  for await (const rows of fetchAllRpc(supabase, "admin_list_awards", { p_achievement_id: id })) {
    for (const row of rows as { user_id: string }[]) recipients.push(row.user_id);
  }

  return <>
    <Link href={`/admin/commu/achievements/${id}`} className="back-link"><PixelIcon name="back" />{achievement.name}</Link>
    <h1 className={styles.title}>Award {achievement.name}</h1>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done === "awarded" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Awarded to {count} new {count === "1" ? "player" : "players"}.</p>}
    </div>

    <AwardList
      // A new key per award resets the ticks once the page reloads after saving.
      key={`${id}:${done ?? ""}:${count ?? ""}`}
      achievementId={id}
      recipients={recipients}
      seed={selectionIds(sel)}
      events={(events.data ?? []).map((event) => ({
        id: event.id,
        label: `${event.name}${event.status === "draft" ? " (draft)" : ""} · ${new Date(event.starts_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}`
      }))}
      initial={"error" in first ? { rows: [], total: 0 } : first}
      // Today in Bangkok; toISOString() would give the UTC date, a day behind before 07:00.
      awardedOn={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" })}
    />
  </>;
}
