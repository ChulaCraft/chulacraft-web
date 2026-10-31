import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Payloads of the insights_* RPCs (supabase/migrations/20261030000001_insights.sql
// and 20261030000002_funnel_failures.sql). Days are Bangkok "YYYY-MM-DD".
// Count series hold only days with a count (zero-fill them); snapshots hold
// only the stats_daily rows that exist (a missing day is a gap).
export type Snapshot = { day: string; players: number; verified: number; guests: number; unverified: number; whitelisted: number; banned: number };
export type PlayersData = { snapshots: Snapshot[]; signups: { day: string; n: number }[]; faculty: { faculty: string; n: number }[] };
export type FunnelData = {
  steps: { step: "signed_in" | "discord" | "verified" | "registered" | "whitelisted"; n: number }[];
  failures: { day: string; step: string; code: string; n: number }[];
};
export type EventRow = { id: string; name: string; starts_at: string; interest: number; attendance: number; self: number; staff: number; backfill: number };
export type EventsData = { events: EventRow[]; attendance: { day: string; n: number }[] };
export type CommunityData = {
  tiers: { tier: string; owners: number; badges: number }[];
  top: { id: string; name: string; tier: string; owners: number }[];
  reports: { day: string; opened: number; resolved: number }[];
  appeals: { day: string; opened: number; decided: number }[];
};
export type StaffData = { actions: { day: string; entity: string; n: number }[] };

type Payloads = {
  insights_players: PlayersData;
  insights_funnel: FunnelData;
  insights_events: EventsData;
  insights_community: CommunityData;
  insights_staff: StaffData;
};
export type InsightsRpc = keyof Payloads;

/** One RPC's outcome: the payload, or `null` when the call failed. */
export type Loaded<T> = { data: T; error: false } | { data: null; error: true };

/**
 * Calls one insights RPC. `days` null means the whole history: the SQL takes
 * `p_days null`, but the generated types say `number`, so this is the one
 * place that passes null through.
 */
export async function insightsRpc<N extends InsightsRpc>(supabase: SupabaseClient<Database>, name: N, days: number | null): Promise<Loaded<Payloads[N]>> {
  const { data, error } = await supabase.rpc(name, { p_days: days as number });
  if (error || data === null || typeof data !== "object") {
    if (error) console.error(`${name} failed`, error.message);
    return { data: null, error: true };
  }
  return { data: data as unknown as Payloads[N], error: false };
}
