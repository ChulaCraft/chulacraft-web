// LOCAL DEV ONLY: true only under `next dev` pointed at a localhost Supabase,
// so the one-click test logins can never run against a hosted project.
export const DEV_LOGIN_ENABLED =
  process.env.NODE_ENV === "development" && /^http:\/\/(127\.0\.0\.1|localhost):/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

// Users from supabase/dev-seed.sql, one per role plus one not yet Chula-verified.
export const DEV_USERS = {
  unverified: "unverified@dev.local",
  guest: "guest@dev.local",
  admin: "admin@dev.local",
  owner: "owner@dev.local",
} as const;
