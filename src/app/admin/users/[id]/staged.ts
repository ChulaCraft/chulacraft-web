import { PRIVACY_FIELDS, LEVEL_OPTIONS, type Privacy } from "@/lib/privacy";
import { STUDY_LEVELS, type ProfileDetails } from "@/lib/faculties";
import { ROLE_LABELS } from "@/lib/staff";
import type { ReviewRow } from "@/components/review-dialog";

/** What the page loaded: the saved values the staged ones are compared with. */
export type Snapshot = {
  role: string;
  profile: ProfileDetails;
  privacy: Privacy;
  banners: { id: string; name: string; granted: boolean }[];
  registrations: { id: string; name: string; desired: boolean }[];
  activeBanId: string | null;
  verification: string;
};

export type Duration = "1d" | "7d" | "30d" | "permanent";
export const DURATIONS: { value: Duration; label: string; days: number | null }[] = [
  { value: "1d", label: "1 day", days: 1 },
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "permanent", label: "Permanent", days: null },
];

/** What the admin has staged in the browser. `banners` and `whitelist` hold the wanted value per id. */
export type Draft = {
  role: string;
  guest: boolean;
  reset: boolean;
  profile: ProfileDetails;
  privacy: Privacy;
  banners: Record<string, boolean>;
  whitelist: Record<string, boolean>;
  lift: boolean;
  ban: { reason: string; note: string; duration: Duration } | null;
};

export type Change = { kind: string; [key: string]: unknown };

/** The p_changes list for admin_apply_player_changes: only what differs, in the
 *  order the database applies it (D1a), one entry per banner and per account. */
export function buildChanges(snap: Snapshot, d: Draft, now: number): Change[] {
  const out: Change[] = [];
  if (d.role !== snap.role) out.push({ kind: "role", role: d.role });
  const p = d.profile, s = snap.profile;
  if (p.first !== s.first || p.last !== s.last || p.nick !== s.nick || p.level !== s.level || p.faculty !== s.faculty || p.major !== s.major) {
    out.push({ kind: "profile", first_name: p.first.trim(), last_name: p.last.trim(), nickname: p.nick.trim(), faculty: p.faculty, major: p.major, study_level: p.level });
  }
  if (PRIVACY_FIELDS.some(([f]) => d.privacy[f] !== snap.privacy[f])) out.push({ kind: "privacy", ...d.privacy });
  for (const b of snap.banners) if (b.id in d.banners && d.banners[b.id] !== b.granted) out.push({ kind: "banner", banner_id: b.id, grant: d.banners[b.id] });
  if (d.reset) out.push({ kind: "chula_reset" });
  if (d.guest) out.push({ kind: "guest" });
  if (d.lift && snap.activeBanId) out.push({ kind: "lift_ban", ban_id: snap.activeBanId });
  for (const r of snap.registrations) if (r.id in d.whitelist && d.whitelist[r.id] !== r.desired) out.push({ kind: "whitelist", registration_id: r.id, value: d.whitelist[r.id] });
  if (d.ban) {
    const days = DURATIONS.find((x) => x.value === d.ban!.duration)?.days ?? null;
    out.push({ kind: "ban", reason: d.ban.reason.trim(), public_note: d.ban.note.trim(), expires_at: days ? new Date(now + days * 86_400_000).toISOString() : null });
  }
  return out;
}

const levelLabel = (v: unknown) => LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? String(v);
const studyLabel = (v: string) => STUDY_LEVELS.find((l) => l.value === v)?.label ?? v;
const shown = (v: string) => v || "Not set";

/** Before and after lines for the review dialog. */
export function reviewRows(snap: Snapshot, changes: Change[]): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const c of changes) {
    switch (c.kind) {
      case "role": rows.push({ label: "Role", before: ROLE_LABELS[snap.role] ?? snap.role, after: ROLE_LABELS[c.role as string] ?? String(c.role) }); break;
      case "profile": {
        const next = { first: c.first_name, last: c.last_name, nick: c.nickname, level: c.study_level, faculty: c.faculty, major: c.major } as ProfileDetails;
        const fields: [string, keyof ProfileDetails][] = [["First name", "first"], ["Last name", "last"], ["Nickname", "nick"], ["Study level", "level"], ["Faculty", "faculty"], ["Major", "major"]];
        for (const [label, k] of fields) {
          if (next[k] === snap.profile[k]) continue;
          rows.push({ label, before: shown(k === "level" ? studyLabel(snap.profile[k]) : snap.profile[k]), after: shown(k === "level" ? studyLabel(next[k]) : next[k]) });
        }
        break;
      }
      case "privacy":
        for (const [f, label] of PRIVACY_FIELDS) if (c[f] !== snap.privacy[f]) rows.push({ label: label === "Profile" ? "Profile privacy" : label, before: levelLabel(snap.privacy[f]), after: levelLabel(c[f]) });
        break;
      case "banner": rows.push({ label: controlName(snap, { kind: "banner", target: c.banner_id as string }) ?? "Banner", before: c.grant ? "Not given" : "Given by staff", after: c.grant ? "Given" : "Taken back" }); break;
      case "chula_reset": rows.push({ label: "Chula link", before: snap.verification === "guest" ? "Guest" : "Linked", after: "Unlinked, unverified" }); break;
      case "guest": rows.push({ label: "Guest status", before: "Unverified", after: "Verified (guest)" }); break;
      case "lift_ban": rows.push({ label: "Ban", before: "Active", after: "Lifted" }); break;
      case "whitelist": rows.push({ label: controlName(snap, { kind: "whitelist", target: c.registration_id as string }) ?? "Minecraft account", before: c.value ? "Removed" : "On the whitelist", after: c.value ? "On the whitelist" : "Removed" }); break;
      case "ban": rows.push({ label: "Ban", before: "Not banned", after: c.expires_at ? `Banned until ${new Date(c.expires_at as string).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}` : "Banned, permanent" }); break;
    }
  }
  return rows;
}

/** Extra warning for the changes that can't be quietly undone. */
export function warningFor(changes: Change[]): string | undefined {
  const lines: string[] = [];
  if (changes.some((c) => c.kind === "ban")) lines.push("Banning removes every whitelisted account, kicks the player within seconds and takes their Discord roles away until the ban ends.");
  if (changes.some((c) => c.kind === "chula_reset")) lines.push("Resetting the Chula link unlinks their Chula account, so they must verify again.");
  if (changes.some((c) => c.kind === "role")) lines.push("A role change takes effect straight away and changes what this person can open.");
  return lines.length ? lines.join(" ") : undefined;
}

/** What the failed control is called, from the RPC's "<kind>:<target id>". Null when unknown. */
export function controlName(snap: Snapshot, c: { kind: string; target: string }): string | null {
  switch (c.kind) {
    case "role": return "Role";
    case "profile": return "Profile";
    case "privacy": return "Privacy";
    case "banner": return `Banner ${snap.banners.find((b) => b.id === c.target)?.name ?? c.target}`;
    case "chula_reset": return "Chula link";
    case "guest": return "Guest status";
    case "lift_ban": return "Lifting the ban";
    case "whitelist": return `Minecraft account ${snap.registrations.find((r) => r.id === c.target)?.name ?? ""}`.trim();
    case "ban": return "Ban";
    default: return null;
  }
}

export const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change this player.",
  LIMIT_REACHED: "This player already has the most active Minecraft accounts allowed.",
  SELF_ROLE_CHANGE: "You can't change your own role.",
  OWNER_ROLE_PROTECTED: "Owners are peers, so you can't change another owner's role.",
  NOT_FOUND: "That record no longer exists. Reload the page and try again.",
  ALREADY_VERIFIED: "This player is already Chula-verified.",
  ALREADY_BANNED: "This player is already banned.",
  SELF_BAN: "You can't ban yourself.",
  BANNED: "This player is banned. Lift the ban to put accounts back on the whitelist.",
  INVALID: "One of the changes isn't valid. Check the reason, profile and privacy values.",
};
