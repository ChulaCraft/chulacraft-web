import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { VerificationBadge, type VerificationKind } from "@/components/verification-badge";
import { describeChange } from "@/lib/change-log";
import { createClient } from "@/lib/supabase/server";
import styles from "../../admin.module.css";
import { when } from "../../overview";
import { toStudyLevel } from "@/lib/faculties";
import { ROLE_LABELS, staffCan } from "@/lib/staff";
import type { Privacy } from "@/lib/privacy";
import { PlayerEditor, type Can } from "./player-editor";
import type { Snapshot } from "./staged";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Player" };

/** admin_get_user returns a jsonb document, so it can't be derived from the
 * generated table types; this mirrors the keys built in 20261004000001. */
/** admin_user_profile is jsonb too (20261018000001). */
type SupportProfile = {
  first_name: string | null; last_name: string | null; nickname: string | null;
  faculty: string | null; major: string | null; study_level: string | null; privacy: Privacy;
} | null;

type Detail = {
  user: { id: string; email: string | null; created_at: string; role: string } | null;
  discord: { id: string; username: string | null } | null;
  verification_kind: VerificationKind;
  chula: { email: string; claimed_at: string } | null;
  guest: { verified_at: string; verified_by_name: string | null } | null;
  google: { email: string | null; linked_at: string }[];
  registrations: { id: string; minecraft_username: string; minecraft_uuid: string; desired_whitelisted: boolean; is_active: boolean; sync_status: string }[];
  log: { id: string; field: string; old_value: string | null; new_value: string | null; source: string; actor_user_id: string | null; created_at: string }[];
};

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: myRole }, { data: { user: me } }, { data: bans }, { data: support }, { data: banners }] = await Promise.all([
    timed("admin_get_user", supabase.rpc("admin_get_user", { p_user_id: id })),
    timed("current_app_role", supabase.rpc("current_app_role")),
    supabase.auth.getUser(),
    timed("admin_user_bans", supabase.rpc("admin_user_bans", { p_user_id: id })),
    timed("admin_user_profile", supabase.rpc("admin_user_profile", { p_user_id: id })),
    // Community area only (event staff too); others get FORBIDDEN and no section.
    timed("admin_user_banners", supabase.rpc("admin_user_banners", { p_user_id: id })),
  ]);
  if (error) {
    return <>
      <Link href="/admin/players" className="back-link"><PixelIcon name="back" />Players</Link>
      <section className={`panel ${styles.errorCard}`} role="alert">
        <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load this player</h1>
        <p className="muted">The player&apos;s details didn&apos;t load. Nothing was changed.</p>
        <Link href={`/admin/users/${id}`} className="link-button">Try again →</Link>
      </section>
    </>;
  }
  const detail = data as Detail;
  if (!detail.user) notFound();
  const target = detail.user;

  const isOwner = myRole === "owner";
  // Edits are owner/admin only; moderators and event staff view. Staff count as
  // non-players, so only an owner edits them (same rule as the RPCs).
  const canManage = staffCan(myRole, "admin") && (isOwner || target.role === "user");
  const canModerate = staffCan(myRole, "moderation");
  const name = detail.discord?.username ?? target.email ?? target.id;
  const handle = detail.discord?.username ?? target.id.slice(0, 8);
  const activeBan = bans?.find((b) => b.active);
  const profile = support as SupportProfile;
  const privacy: Privacy = profile?.privacy ?? { profile: "public", minecraft: "public", achievements: "public", friends: "public" };
  const isSelf = me?.id === target.id;

  const can: Can = {
    guest: canManage && detail.verification_kind === "unverified",
    reset: canManage && Boolean(detail.chula || detail.guest),
    role: canManage && isOwner && !isSelf && target.role !== "owner",
    removeStaff: myRole === "admin" && (target.role === "moderator" || target.role === "event_staff"),
    ban: canModerate && target.role === "user" && !isSelf && !activeBan,
    lift: canModerate && Boolean(activeBan),
    profile: canManage,
    privacy: canManage,
    banners: Boolean(banners),
    whitelist: canManage,
  };
  const showBans = canModerate && (target.role === "user" || (bans?.length ?? 0) > 0);

  const snapshot: Snapshot = {
    role: target.role,
    profile: { first: profile?.first_name ?? "", last: profile?.last_name ?? "", nick: profile?.nickname ?? "", level: toStudyLevel(profile?.study_level), faculty: profile?.faculty ?? "", major: profile?.major ?? "" },
    privacy,
    banners: (banners ?? []).map((b) => ({ id: b.id, name: b.name, granted: b.granted })),
    registrations: detail.registrations.map((r) => ({ id: r.id, name: r.minecraft_username, desired: r.desired_whitelisted })),
    activeBanId: activeBan?.id ?? null,
    verification: detail.verification_kind,
  };

  return <>
    <Link href="/admin/players" className="back-link"><PixelIcon name="back" />Players</Link>

    <section className={`panel ${styles.userHead}`} aria-labelledby="p-name">
      <span className={`avatar ${styles.avatarLg}`} aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <div className={styles.userName}>
        <h1 id="p-name" className={styles.title}>{name}</h1>
        {detail.discord?.username && <p className="muted">@{detail.discord.username}</p>}
      </div>
      <div className={styles.badges}>
        <VerificationBadge kind={detail.verification_kind} />
        <span className={styles.roleBadge}>Role: {ROLE_LABELS[target.role] ?? target.role}</span>
        {activeBan && <span className="badge badge-danger"><PixelIcon name="revoked" />Banned</span>}
      </div>
    </section>

    <PlayerEditor
      userId={id}
      name={name}
      handle={handle}
      targetRole={target.role}
      snapshot={snapshot}
      can={can}
      chula={detail.chula ? { email: detail.chula.email } : null}
      guest={Boolean(detail.guest)}
      bans={showBans ? (bans ?? []).map((b) => ({
        id: b.id, active: b.active, reason: b.reason, publicNote: b.public_note,
        until: b.expires_at ? when(b.expires_at) : "Permanent", by: b.created_by_name ?? "a removed admin",
        at: when(b.created_at), atIso: b.created_at,
        outcome: b.lifted_by_name ? `lifted by ${b.lifted_by_name}` : b.expires_at ? "expired" : "lifted",
      })) : []}
      banners={banners ? banners.map((b) => ({ id: b.id, name: b.name, colors: b.colors, image: b.image_path, still: b.still_path, kind: b.kind, granted: b.granted, owned: b.owned, selected: b.selected, eventNames: b.event_names })) : null}
      accounts={detail.registrations.map((r) => ({ id: r.id, name: r.minecraft_username, uuid: r.minecraft_uuid, desired: r.desired_whitelisted, active: r.is_active, syncStatus: r.sync_status }))}
      details={
        <section className="panel" aria-labelledby="det-title">
          <h2 id="det-title" className={styles.sectionTitle}>Details</h2>
          <dl className={styles.facts}>
            <dt>Email</dt><dd className="mono">{target.email ?? "—"}</dd>
            <dt>Discord ID</dt><dd className="mono">{detail.discord?.id ?? "Not linked"}</dd>
            <dt>Chula</dt>
            <dd>
              {detail.chula
                ? <><span className="mono">{detail.chula.email}</span>{detail.verification_kind !== "verified" && <span className="hint"> (claimed, Google unlinked)</span>}</>
                : <span className="hint">{detail.guest ? "No Chula account (guest)" : "Not verified"}</span>}
            </dd>
            {detail.guest && <><dt>Guest</dt><dd>Verified by {detail.guest.verified_by_name ?? "a removed admin"} · {when(detail.guest.verified_at)}</dd></>}
            <dt>Google</dt><dd className="mono">{detail.google.length ? detail.google.map((g) => g.email ?? "—").join(", ") : "None"}</dd>
            <dt>Joined</dt><dd>{when(target.created_at)}</dd>
          </dl>
        </section>
      }
      log={staffCan(myRole, "admin") ? (
        // Per-player history is audit data: owner/admin only, like /admin/audit.
        <section className="panel" aria-labelledby="log-title">
          <div className={styles.listHead}>
            <h2 id="log-title" className={styles.sectionTitle}>Change log</h2>
            <Link href={`/admin/audit?target=${id}`} className="hint">Admin actions in audit log →</Link>
          </div>
          {detail.log.length === 0 ? <p className="muted">No changes recorded.</p> : (
            <ol className={styles.log}>
              {detail.log.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.created_at}>{when(entry.created_at)}</time>
                  <span>
                    <strong>{entry.source === "admin" ? (entry.actor_user_id === me?.id ? "you" : "an admin") : name}</strong>{" "}
                    <span className="muted">{describeChange(entry.field, entry.old_value, entry.new_value)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    />
  </>;
}
