// Mirror of public.staff_can() (20261019000001). The database is the real
// gate; this only decides what the admin UI shows.
export type Area = "players_read" | "moderation" | "community" | "admin";

const AREAS: Record<string, readonly Area[]> = {
  owner: ["players_read", "moderation", "community", "admin"],
  admin: ["players_read", "moderation", "community", "admin"],
  moderator: ["players_read", "moderation"],
  event_staff: ["players_read", "community"],
};

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", moderator: "Moderator", event_staff: "Event staff", user: "Player",
};

export const staffCan = (role: string | null | undefined, area: Area) => Object.hasOwn(AREAS, role ?? "") && AREAS[role!].includes(area);
export const isStaff = (role: string | null | undefined) => staffCan(role, "players_read");
