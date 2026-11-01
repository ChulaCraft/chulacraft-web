// Audit log filters, shared by the page and its CSV export.

export const ENTITIES: Record<string, string> = {
  minecraft_registrations: "Minecraft accounts",
  profiles: "Profiles and roles",
  chula_claims: "Chula verification",
  identities: "Linked accounts",
  achievements: "Achievements",
  events: "Events",
  achievement_awards: "Awards",
  announcements: "Announcements",
  server_console: "Server console",
  ops: "Ops console",
  bot_settings: "Discord bot settings",
  bot_jobs: "Discord bot tasks",
  bans: "Bans",
  appeals: "Appeals",
  reports: "Reports",
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight in Bangkok for a yyyy-mm-dd from a date input, as ISO; null if malformed. */
export const bangkokDay = (day: string | undefined, plusDays = 0) =>
  day && DAY.test(day) ? new Date(Date.parse(`${day}T00:00:00+07:00`) + plusDays * 86_400_000).toISOString() : null;
