import { staffCan, type Area } from "@/lib/staff";

export type TabId = "overview" | "players" | "events" | "community" | "staff";

// Mirrors the staff_can() gates on the insights_* RPCs.
export const TABS: { id: TabId; label: string; area: Area }[] = [
  { id: "overview", label: "Overview", area: "admin" },
  { id: "players", label: "Players", area: "admin" },
  { id: "events", label: "Events", area: "community" },
  { id: "community", label: "Community", area: "moderation" },
  { id: "staff", label: "Staff activity", area: "admin" },
];

export const allowedTabs = (role: string | null): TabId[] => TABS.filter((t) => staffCan(role, t.area)).map((t) => t.id);

export const pickTab = (v: string | undefined, allowed: TabId[]): TabId | null => allowed.find((t) => t === v) ?? allowed[0] ?? null;
