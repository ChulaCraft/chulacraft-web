export const MINECRAFT_USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
/** Mirrors the limit enforced by add_minecraft_account in the database. */
export const MAX_MINECRAFT_ACCOUNTS = 5;

export type SyncStatus = "pending" | "synced" | "failed";

export type RegistrationView = {
  id: string;
  minecraftUsername: string;
  desiredWhitelisted: boolean;
  syncStatus: SyncStatus;
  updatedAt: string;
};

export const REGISTRATION_COLUMNS = "id, minecraft_username, desired_whitelisted, sync_status, updated_at";

/** Maps a minecraft_registrations row to the fields the player may see. */
export function toRegistrationView(row: Record<string, unknown>): RegistrationView {
  return {
    id: String(row.id),
    minecraftUsername: String(row.minecraft_username),
    desiredWhitelisted: Boolean(row.desired_whitelisted),
    syncStatus: row.sync_status as SyncStatus,
    updatedAt: String(row.updated_at)
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
  if (code === "23505" || message.includes("REGISTRATION_CONFLICT")) return { status: 409, error: "This Minecraft account is already registered to another player." };
  if (message.includes("LIMIT_REACHED")) return { status: 409, error: `You can have up to ${MAX_MINECRAFT_ACCOUNTS} Minecraft accounts.` };
  if (message.includes("CU_SSO_REQUIRED")) return { status: 403, error: "Link your Chula SSO account before adding a Minecraft account." };
  if (message.includes("DISCORD_IDENTITY_REQUIRED")) return { status: 403, error: "Sign in with Discord before adding a Minecraft account." };
  if (message.includes("REGISTRATION_BLOCKED")) return { status: 403, error: "An admin removed this Minecraft account. Contact an admin to restore it." };
  if (message.includes("NOT_FOUND")) return { status: 404, error: "That Minecraft account is no longer on your list. Refresh and try again." };
  return { status: 503, error: "We couldn’t save the registration. Please try again." };
}
