import Link from "next/link";
import { notFound } from "next/navigation";
import { MAX_MINECRAFT_ACCOUNTS } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "../../admin.module.css";
import { setRole, setWhitelisted } from "./actions";

type Detail = {
  user: { id: string; email: string | null; created_at: string; role: string } | null;
  discord: { id: string; username: string | null } | null;
  chula: { chula_uid: string; chula_username: string; email: string | null; display_name: string | null; linked_at: string } | null;
  registrations: { id: string; minecraft_username: string; minecraft_uuid: string; desired_whitelisted: boolean; is_active: boolean; sync_status: string }[];
  log: { id: string; field: string; old_value: string | null; new_value: string | null; source: string; actor_user_id: string | null; created_at: string }[];
};

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to change this player.",
  LIMIT_REACHED: `This player already has ${MAX_MINECRAFT_ACCOUNTS} active Minecraft accounts.`,
  SELF_ROLE_CHANGE: "You can't change your own role.",
  NOT_FOUND: "That record no longer exists. Refresh and try again.",
};

export default async function AdminUserPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const errorCode = (await searchParams).error;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: myRole }, { data: { user: me } }] = await Promise.all([
    supabase.rpc("admin_get_user", { p_user_id: id }),
    supabase.rpc("current_app_role"),
    supabase.auth.getUser(),
  ]);
  if (error) throw new Error("Could not load player.");
  const detail = data as Detail;
  if (!detail.user) notFound();

  const isOwner = myRole === "owner";
  const canManage = isOwner || detail.user.role === "user";

  return (
    <>
      <p><Link href="/admin">← All players</Link></p>
      {errorCode && <p className={styles.error} role="alert">{ERRORS[errorCode] ?? "The change could not be saved. Please try again."}</p>}

      <section className={styles.panel} aria-labelledby="user-title">
        <h1 id="user-title">{detail.discord?.username ?? detail.user.email ?? detail.user.id}</h1>
        <dl className={styles.facts}>
          <dt>Email</dt><dd>{detail.user.email ?? "—"}</dd>
          <dt>Discord ID</dt><dd>{detail.discord?.id ?? "Not linked"}</dd>
          <dt>Chula SSO</dt><dd>{detail.chula ? `${detail.chula.chula_username} (${detail.chula.chula_uid})` : "Not linked"}</dd>
          <dt>Joined</dt><dd>{new Date(detail.user.created_at).toLocaleString("en-GB")}</dd>
          <dt>Role</dt>
          <dd>
            {isOwner && me?.id !== detail.user.id ? (
              <form action={setRole} className={styles.inline}>
                <input type="hidden" name="userId" value={detail.user.id} />
                <label htmlFor="role" className="sr-only">Role</label>
                <select id="role" name="role" defaultValue={detail.user.role}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
                <button className="button button-header-signup" type="submit">Save role</button>
              </form>
            ) : detail.user.role}
          </dd>
        </dl>
      </section>

      <section className={styles.panel} aria-labelledby="accounts-title">
        <h2 id="accounts-title">Minecraft accounts</h2>
        {detail.registrations.length === 0 ? <p className={styles.muted}>No Minecraft accounts.</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>UUID</th><th>Whitelist</th><th>Sync</th><th /></tr></thead>
              <tbody>
                {detail.registrations.map((account) => (
                  <tr key={account.id}>
                    <td>{account.minecraft_username}</td>
                    <td className={styles.muted}>{account.minecraft_uuid}</td>
                    <td>{account.desired_whitelisted ? "Active" : account.is_active ? "Removed" : "Deleted by player"}</td>
                    <td>{account.sync_status}</td>
                    <td>
                      {canManage && (
                        <form action={setWhitelisted}>
                          <input type="hidden" name="userId" value={detail.user!.id} />
                          <input type="hidden" name="registrationId" value={account.id} />
                          <input type="hidden" name="value" value={String(!account.desired_whitelisted)} />
                          <button className="button button-header-signup" type="submit">
                            {account.desired_whitelisted ? "Remove" : "Restore"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="log-title">
        <h2 id="log-title">Change log</h2>
        {detail.log.length === 0 ? <p className={styles.muted}>No changes recorded.</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>When</th><th>Field</th><th>From</th><th>To</th><th>By</th></tr></thead>
              <tbody>
                {detail.log.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.created_at).toLocaleString("en-GB")}</td>
                    <td>{entry.field}</td>
                    <td>{entry.old_value ?? "—"}</td>
                    <td>{entry.new_value ?? "—"}</td>
                    <td>{entry.source === "admin" ? `admin (${entry.actor_user_id === me?.id ? "you" : entry.actor_user_id?.slice(0, 8)})` : "player"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
