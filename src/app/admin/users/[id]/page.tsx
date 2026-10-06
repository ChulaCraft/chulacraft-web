import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { VerificationBadge, type VerificationKind } from "@/components/verification-badge";
import { describeChange } from "@/lib/change-log";
import { MAX_MINECRAFT_ACCOUNTS, syncBadge, toSyncStatus } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../admin.module.css";
import { when } from "../../overview";
import { banUser, liftBan, markGuest, resetChula, setWhitelisted } from "./actions";
import { RoleControl } from "./role-control";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Player" };

/** admin_get_user returns a jsonb document, so it can't be derived from the
 * generated table types; this mirrors the keys built in 20261004000001. */
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

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change this player.",
  LIMIT_REACHED: `This player already has ${MAX_MINECRAFT_ACCOUNTS} active Minecraft accounts.`,
  SELF_ROLE_CHANGE: "You can't change your own role.",
  OWNER_ROLE_PROTECTED: "Owners are peers, so you can't change another owner's role.",
  NOT_FOUND: "That record no longer exists. Refresh and try again.",
  ALREADY_VERIFIED: "This player is already Chula-verified.",
  ALREADY_BANNED: "This player is already banned.",
  SELF_BAN: "You can't ban yourself.",
  BANNED: "This player is banned. Lift the ban to put accounts back on the whitelist.",
  INVALID: "Give a reason and pick how long the ban lasts.",
};

const DONE: Record<string, string> = {
  reset: "Verification reset. They'll be asked to verify again.",
  guest: "Marked as verified (guest). They can add Minecraft accounts now.",
  role: "Role changed.",
  restored: "Account put back on the whitelist.",
  removed: "Account removed from the whitelist.",
  banned: "Player banned. Their accounts leave the whitelist and they're kicked within a few seconds.",
  lifted: "Ban lifted. The accounts it removed are going back on the whitelist.",
};

export default async function AdminUserPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: myRole }, { data: { user: me } }, { data: bans }] = await Promise.all([
    supabase.rpc("admin_get_user", { p_user_id: id }),
    supabase.rpc("current_app_role"),
    supabase.auth.getUser(),
    supabase.rpc("admin_user_bans", { p_user_id: id }),
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
  const canManage = isOwner || target.role === "user";
  const name = detail.discord?.username ?? target.email ?? target.id;
  const handle = detail.discord?.username ?? target.id.slice(0, 8);
  const activeBan = bans?.find((b) => b.active);

  return <>
    <Link href="/admin/players" className="back-link"><PixelIcon name="back" />Players</Link>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? "The change couldn't be saved. Please try again."}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <section className={`panel ${styles.userHead}`} aria-labelledby="p-name">
      <span className={`avatar ${styles.avatarLg}`} aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      <div className={styles.userName}>
        <h1 id="p-name" className={styles.title}>{name}</h1>
        {detail.discord?.username && <p className="muted">@{detail.discord.username}</p>}
      </div>
      <div className={styles.badges}>
        <VerificationBadge kind={detail.verification_kind} />
        <span className={styles.roleBadge}>Role: {target.role}</span>
        {activeBan && <span className="badge badge-danger"><PixelIcon name="revoked" />Banned</span>}
      </div>
    </section>

    <div className={styles.columns}>
      <div className={styles.sideCol}>
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

        {canManage && (
          <section className={`panel ${styles.actionsCard}`} aria-labelledby="act-title">
            <h2 id="act-title" className={styles.sectionTitle}>Actions</h2>
            {detail.verification_kind === "unverified" && (
              <div className={styles.actionRow}>
                <p className="hint">Let someone without a Chula account add Minecraft accounts.</p>
                <ConfirmAction
                  action={markGuest}
                  fields={{ userId: target.id }}
                  trigger="Mark as verified (guest)"
                  triggerClassName="btn btn-sm"
                  title={`Mark ${name} as verified (guest)?`}
                  body={`${name} will be able to add Minecraft accounts without a Chula account. Only do this for people an admin has invited.`}
                  confirmLabel="Mark as verified"
                />
              </div>
            )}
            {(detail.chula || detail.guest) && (
              <div className={styles.actionRow}>
                <p className="hint">Unlink their Chula account and guest status so they have to verify again.</p>
                <ConfirmAction
                  action={resetChula}
                  fields={{ userId: target.id }}
                  trigger="Reset Chula link"
                  triggerClassName="btn btn-sm btn-danger-outline"
                  title={`Reset ${name}'s Chula link?`}
                  body={`${detail.chula ? `This unlinks ${detail.chula.email}${detail.guest ? " and removes guest status" : ""}.` : "This removes guest status."} ${name} goes back to Unverified and will be asked to verify their Chula account again.`}
                  confirmLabel="Reset Chula link"
                  confirmClassName="btn btn-danger"
                />
              </div>
            )}
            {isOwner && me?.id !== target.id && target.role !== "owner" && (
              <div className={styles.roleRow}><RoleControl userId={target.id} role={target.role} name={name} handle={handle} /></div>
            )}
          </section>
        )}

        {(target.role === "user" || (bans?.length ?? 0) > 0) && (
          <section className={`panel ${styles.actionsCard}`} aria-labelledby="ban-title">
            <h2 id="ban-title" className={styles.sectionTitle}>Ban</h2>
            {activeBan ? (
              <div className={styles.actionRow}>
                <dl className={styles.facts}>
                  <dt>Reason</dt><dd>{activeBan.reason}</dd>
                  <dt>Player sees</dt><dd>{activeBan.public_note ?? <span className="hint">No note</span>}</dd>
                  <dt>Until</dt><dd>{activeBan.expires_at ? when(activeBan.expires_at) : "Permanent"}</dd>
                  <dt>By</dt><dd>{activeBan.created_by_name ?? "a removed admin"} · {when(activeBan.created_at)}</dd>
                </dl>
                <ConfirmAction
                  action={liftBan}
                  fields={{ userId: target.id, banId: activeBan.id }}
                  trigger="Lift ban"
                  triggerClassName="btn btn-sm"
                  title={`Lift ${name}'s ban?`}
                  body={`The Minecraft accounts the ban removed go back on the whitelist, and ${name} gets their Discord roles back.`}
                  confirmLabel="Lift ban"
                />
              </div>
            ) : target.role === "user" && me?.id !== target.id ? (
              <details>
                <summary className="btn btn-sm btn-danger-outline">Ban {name}</summary>
                <form action={banUser} className="stack gap-10" style={{ marginTop: 12 }}>
                  <input type="hidden" name="userId" value={target.id} />
                  <label className="stack gap-6">
                    <span className="label">Reason (admins only)</span>
                    <textarea className={styles.textarea} name="reason" rows={2} maxLength={1000} required />
                  </label>
                  <label className="stack gap-6">
                    <span className="label">Note to the player <span className="optional">optional</span></span>
                    <textarea className={styles.textarea} name="publicNote" rows={2} maxLength={1000} />
                  </label>
                  <label className="stack gap-6">
                    <span className="label">Length</span>
                    <select className="input" name="duration" defaultValue="7d">
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </label>
                  <p className="hint">Every whitelisted account leaves the whitelist, they&apos;re kicked, and they lose their Discord roles until the ban ends.</p>
                  <SubmitButton className="btn btn-sm btn-danger">Ban player</SubmitButton>
                </form>
              </details>
            ) : null}
            {bans && bans.some((b) => !b.active) && (
              <ol className={styles.log}>
                {bans.filter((b) => !b.active).map((b) => (
                  <li key={b.id}>
                    <time dateTime={b.created_at}>{when(b.created_at)}</time>
                    <span>
                      {b.reason} <span className="hint">· {b.lifted_by_name ? `lifted by ${b.lifted_by_name}` : b.expires_at ? "expired" : "lifted"}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>

      <div className={styles.mainCol}>
        <section className={`panel ${styles.flush}`} aria-labelledby="mc-title">
          <h2 id="mc-title" className={`${styles.sectionTitle} ${styles.flushTitle}`}>Minecraft accounts</h2>
          {detail.registrations.length === 0 ? <p className={`muted ${styles.flushTitle}`}>No Minecraft accounts added yet.</p> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Name</th><th scope="col">UUID</th><th scope="col">Whitelist</th><th scope="col">Sync</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {detail.registrations.map((account) => {
                    const badge = syncBadge({ desiredWhitelisted: account.desired_whitelisted, syncStatus: toSyncStatus(account.sync_status) });
                    return (
                      <tr key={account.id}>
                        <td className="mono" data-dim={!account.desired_whitelisted || undefined}>{account.minecraft_username}</td>
                        <td className="mono" title={account.minecraft_uuid}>{account.minecraft_uuid.slice(0, 8)}…{account.minecraft_uuid.slice(-4)}</td>
                        <td>{account.desired_whitelisted ? <span className="tone-green">Active</span> : account.is_active ? "Removed by admin" : "Removed by player"}</td>
                        <td>{account.desired_whitelisted ? <span className={`badge badge-${badge.tone}`}><PixelIcon name={badge.icon} />{badge.label}</span> : <span className="hint">—</span>}</td>
                        <td className={styles.right}>
                          {canManage && (
                            <ConfirmAction
                              action={setWhitelisted}
                              fields={{ userId: target.id, registrationId: account.id, value: String(!account.desired_whitelisted) }}
                              trigger={account.desired_whitelisted ? "Remove" : "Restore"}
                              triggerLabel={`${account.desired_whitelisted ? "Remove" : "Restore"} ${account.minecraft_username}`}
                              triggerClassName={account.desired_whitelisted ? "btn btn-sm btn-danger-outline" : "btn btn-sm btn-outline"}
                              title={`${account.desired_whitelisted ? "Remove" : "Restore"} ${account.minecraft_username}?`}
                              body={account.desired_whitelisted
                                ? `${account.minecraft_username} leaves the whitelist and can't join until it's restored.`
                                : `${account.minecraft_username} goes back on ${name}'s profile and the whitelist.`}
                              confirmLabel={account.desired_whitelisted ? "Remove account" : "Restore account"}
                              confirmClassName={account.desired_whitelisted ? "btn btn-danger" : "btn btn-primary"}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
      </div>
    </div>
  </>;
}
