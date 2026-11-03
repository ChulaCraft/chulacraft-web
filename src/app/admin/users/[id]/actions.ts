"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { validateProfile, type ProfileDetails } from "@/lib/faculties";
import type { Json } from "@/lib/supabase/database.types";

// The RPC enforces every role rule and applies the whole list in one
// transaction. This action only checks the shape of what the browser staged, so a
// malformed request never reaches the database, and rebuilds each entry from
// known fields only.
const MAX_CHANGES = 60;
const ROLES = ["user", "moderator", "event_staff", "admin", "owner"];
const LEVELS = ["public", "friends", "private"];
const BANNER_ID = /^[a-z0-9-]{2,32}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const uuid = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);

/** One staged entry as the RPC wants it, or null when it isn't valid. */
function clean(c: unknown): Json | null {
  if (!isObj(c)) return null;
  switch (c.kind) {
    case "role": return ROLES.includes(str(c.role)) ? { kind: "role", role: c.role as string } : null;
    case "profile": {
      const v: ProfileDetails = { first: str(c.first_name).trim(), last: str(c.last_name).trim(), nick: str(c.nickname).trim(), level: str(c.study_level) as ProfileDetails["level"], faculty: str(c.faculty), major: str(c.major) };
      if (Object.keys(validateProfile(v)).length) return null;
      return { kind: "profile", first_name: v.first, last_name: v.last, nickname: v.nick, faculty: v.faculty, major: v.major, study_level: v.level };
    }
    case "privacy": {
      const levels = ["profile", "minecraft", "achievements", "friends"].map((f) => str(c[f]));
      if (!levels.every((l) => LEVELS.includes(l))) return null;
      return { kind: "privacy", profile: levels[0], minecraft: levels[1], achievements: levels[2], friends: levels[3] };
    }
    case "banner": return BANNER_ID.test(str(c.banner_id)) && typeof c.grant === "boolean" ? { kind: "banner", banner_id: c.banner_id as string, grant: c.grant } : null;
    case "chula_reset": return { kind: "chula_reset" };
    case "guest": return { kind: "guest" };
    case "lift_ban": { const id = uuid(c.ban_id); return id ? { kind: "lift_ban", ban_id: id } : null; }
    case "whitelist": { const id = uuid(c.registration_id); return id && typeof c.value === "boolean" ? { kind: "whitelist", registration_id: id, value: c.value } : null; }
    case "ban": {
      const reason = str(c.reason).trim(), note = str(c.public_note).trim();
      const expires = c.expires_at === null || c.expires_at === undefined ? null : str(c.expires_at);
      if (!reason || reason.length > 1000 || note.length > 1000 || (expires !== null && Number.isNaN(Date.parse(expires)))) return null;
      return { kind: "ban", reason, public_note: note, expires_at: expires };
    }
    default: return null;
  }
}

export type ApplyResult = { ok: true } | { ok: false; code: string; control: { kind: string; target: string } | null };
const invalid = { ok: false, code: "INVALID", control: null } as const;

/** Applies the staged review of one player. All of it saves, or none of it. */
export async function applyPlayerChanges(userId: string, changes: unknown): Promise<ApplyResult> {
  if (!UUID.test(userId) || !Array.isArray(changes) || changes.length === 0 || changes.length > MAX_CHANGES) return invalid;
  const list = changes.map(clean);
  if (list.some((c) => c === null)) return invalid;
  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("admin_apply_player_changes", { p_user_id: userId, p_changes: list as Json[] });
    if (error) {
      // The RPC puts "<kind>:<target id>" in details.
      const [kind, target] = typeof (error as { details?: unknown }).details === "string" ? (error as { details: string }).details.split(":") : [];
      return { ok: false, code: dbErrorCode(error) ?? "FAILED", control: kind && target ? { kind, target } : null };
    }
  } catch {
    return { ok: false, code: "FAILED", control: null };
  }
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}
