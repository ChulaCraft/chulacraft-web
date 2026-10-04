import { dbErrorCode } from "@/lib/db-error";
import type { Database } from "@/lib/supabase/database.types";

export const MINECRAFT_USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
/** Shared by every entry point that forwards an id to the database. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Mirrors the limit enforced by add_minecraft_account in the database. */
export const MAX_MINECRAFT_ACCOUNTS = 5;

export type SyncStatus = "pending" | "synced" | "failed";

/** sync_status is a text column, so the generator types it as string. The check
 * constraint in 202607270001 limits it to exactly these three values. */
export function toSyncStatus(value: string): SyncStatus {
  return value === "synced" ? "synced" : value === "failed" ? "failed" : "pending";
}

export type RegistrationView = {
  id: string;
  minecraftUsername: string;
  desiredWhitelisted: boolean;
  syncStatus: SyncStatus;
  updatedAt: string;
};

export const REGISTRATION_COLUMNS = "id, minecraft_username, desired_whitelisted, sync_status, updated_at";

/** The columns above, typed from the database. Keep in step with REGISTRATION_COLUMNS. */
export type RegistrationRow = Pick<
  Database["public"]["Tables"]["minecraft_registrations"]["Row"],
  "id" | "minecraft_username" | "desired_whitelisted" | "sync_status" | "updated_at"
>;

/** Maps a minecraft_registrations row to the fields the player may see. */
export function toRegistrationView(row: RegistrationRow): RegistrationView {
  return {
    id: row.id,
    minecraftUsername: row.minecraft_username,
    desiredWhitelisted: row.desired_whitelisted,
    syncStatus: toSyncStatus(row.sync_status),
    updatedAt: row.updated_at
  };
}

export function normalizeMinecraftUsername(value: string) {
  return value.trim();
}

export function isValidMinecraftUsername(value: string) {
  return MINECRAFT_USERNAME_PATTERN.test(normalizeMinecraftUsername(value));
}

export function statusMessage(registration: Pick<RegistrationView, "desiredWhitelisted" | "syncStatus">) {
  if (!registration.desiredWhitelisted) {
    return "This registration is no longer active. Contact an admin.";
  }
  if (registration.syncStatus === "synced") {
    return "You are whitelisted. You can join the server.";
  }
  if (registration.syncStatus === "failed") {
    return "Registration saved, but the server could not be updated yet. We’ll retry automatically.";
  }
  return "Registration saved. Waiting for the Minecraft server.";
}

/** Maps a database RPC error to an HTTP status and player-facing copy. */
export function registrationError(message: string, code?: string): { status: number; error: string } {
  const raised = dbErrorCode({ message });
  if (code === "23505" || raised === "REGISTRATION_CONFLICT") return { status: 409, error: "This Minecraft account is already registered to another player." };
  if (raised === "LIMIT_REACHED") return { status: 409, error: `You can have up to ${MAX_MINECRAFT_ACCOUNTS} Minecraft accounts.` };
  if (raised === "CU_SSO_REQUIRED") return { status: 403, error: "Verify your Chula Google account before adding a Minecraft account." };
  if (raised === "DISCORD_IDENTITY_REQUIRED") return { status: 403, error: "Sign in with Discord before adding a Minecraft account." };
  if (raised === "REGISTRATION_BLOCKED") return { status: 403, error: "An admin removed this Minecraft account. Contact an admin to restore it." };
  if (raised === "NOT_FOUND") return { status: 404, error: "That Minecraft account is no longer on your list. Refresh and try again." };
  return { status: 503, error: "We couldn’t save the registration. Please try again." };
}

export type SyncBadge = { label: string; tone: "green" | "lavender" | "amber" | "danger"; icon: "check" | "clock" | "retry" | "revoked"; note: string };

/** Player-facing badge for a registration; "Revoked" wins over the worker's sync state. */
export function syncBadge(registration: Pick<RegistrationView, "desiredWhitelisted" | "syncStatus">): SyncBadge {
  if (!registration.desiredWhitelisted) return { label: "Revoked", tone: "danger", icon: "revoked", note: "An admin removed this account from the whitelist." };
  if (registration.syncStatus === "synced") return { label: "Synced", tone: "green", icon: "check", note: "On the whitelist. You can join now." };
  if (registration.syncStatus === "failed") return { label: "Retrying", tone: "amber", icon: "retry", note: "The server couldn't be reached yet. It retries automatically, so there's nothing you need to do." };
  return { label: "Pending", tone: "lavender", icon: "clock", note: "Waiting for the server to add it to the whitelist. This usually takes a few minutes." };
}
