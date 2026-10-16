import type { Database } from "@/lib/supabase/database.types";
import { readTable, tableHref, type Column, type Filters, type RawParams, type TableState } from "@/lib/table-query";

// The players table, per docs/admin-tables.md. Keys match admin_list_players.
export const BASE = "/admin/players";
export const PAGE_SIZE = 50;

export const COLUMNS: Column[] = [
  { key: "player", label: "Player", sort: true, filter: "text" },
  { key: "minecraft", label: "Minecraft", sort: true, filter: "text" },
  { key: "whitelist", label: "Whitelist", sort: true, filter: "enum", options: [
    { value: "whitelisted", label: "Whitelisted" }, { value: "pending", label: "Pending sync" },
    { value: "retrying", label: "Retrying" }, { value: "none", label: "No account" }] },
  { key: "status", label: "Status", sort: true, filter: "enum", options: [
    { value: "verified", label: "Verified Chula" }, { value: "guest", label: "Guest" }, { value: "unverified", label: "Unverified" }] },
  { key: "role", label: "Role", sort: true, filter: "enum", options: [
    { value: "user", label: "Player" }, { value: "moderator", label: "Moderator" }, { value: "event_staff", label: "Event staff" },
    { value: "admin", label: "Admin" }, { value: "owner", label: "Owner" }] },
  { key: "banned", label: "Banned", sort: true, filter: "enum", options: [{ value: "yes", label: "Banned" }, { value: "no", label: "Not banned" }] },
  { key: "joined", label: "Joined", sort: true, filter: "date" },
];

export type PlayerRow = Database["public"]["Functions"]["admin_list_players"]["Returns"][number];

export const readPlayers = (sp: RawParams) => readTable(sp, COLUMNS);
/** No sort chosen = newest first. */
export const rpcArgs = (s: TableState) => ({ p_filters: s.filters, p_query: s.q, p_sort: s.sort || "joined", p_desc: s.sort ? s.desc : true });
const EMPTY: TableState = { q: "", sort: "", desc: true, filters: {} };
export const hrefFor = (state: TableState, patch: Parameters<typeof tableHref>[2] = {}) => tableHref(BASE, state, patch);
/** A players view link, e.g. from a dashboard number. */
export const playersHref = (filters: Filters) => hrefFor(EMPTY, { filters });

/** Saved views. Player statuses count role = user only, like the dashboard tiles. */
export const VIEWS: { label: string; filters: Filters }[] = [
  { label: "Everyone", filters: {} },
  { label: "Players", filters: { role: ["user"] } },
  { label: "Verified Chula", filters: { role: ["user"], status: ["verified"] } },
  { label: "Guests", filters: { role: ["user"], status: ["guest"] } },
  { label: "Unverified", filters: { role: ["user"], status: ["unverified"] } },
  { label: "Staff", filters: { role: ["moderator", "event_staff", "admin", "owner"] } },
  { label: "Banned", filters: { banned: ["yes"] } },
];

const same = (a: Filters, b: Filters) => {
  const norm = (f: Filters) => JSON.stringify(Object.keys(f).sort().map((k) => [k, f[k]]));
  return norm(a) === norm(b);
};
export const activeView = (s: TableState) => VIEWS.find((v) => same(v.filters, s.filters))?.label ?? null;
