import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { describeChange } from "@/lib/change-log";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import styles from "../admin.module.css";
import { when } from "../overview";

export const metadata: Metadata = { title: "Audit log" };

type Entry = Database["public"]["Functions"]["admin_audit_log"]["Returns"][number];
type Params = { actor?: string; target?: string; entity?: string; from?: string; to?: string; before?: string };

const ENTITIES: Record<string, string> = {
  minecraft_registrations: "Minecraft accounts",
  profiles: "Profiles and roles",
  chula_claims: "Chula verification",
  identities: "Linked accounts",
  achievements: "Achievements",
  events: "Events",
  achievement_awards: "Awards",
  announcements: "Announcements",
  server_console: "Server console",
  bans: "Bans",
  appeals: "Appeals",
  reports: "Reports",
};
const PAGE = 50;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight in Bangkok for a yyyy-mm-dd from a date input, as ISO; null if malformed. */
const bangkokDay = (day: string | undefined, plusDays = 0) =>
  day && DAY.test(day) ? new Date(Date.parse(`${day}T00:00:00+07:00`) + plusDays * 86_400_000).toISOString() : null;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const actor = p.actor && UUID.test(p.actor) ? p.actor : undefined;
  const target = p.target && UUID.test(p.target) ? p.target : undefined;
  const entity = p.entity && p.entity in ENTITIES ? p.entity : undefined;
  // Cursor is "<created_at>_<id>" of the last row on the previous page.
  const [beforeAt, beforeId] = p.before?.split("_") ?? [];
  const cursor = beforeAt && !Number.isNaN(Date.parse(beforeAt)) && beforeId && UUID.test(beforeId);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_audit_log", {
    p_actor: actor,
    p_target: target,
    p_entity: entity,
    p_from: bangkokDay(p.from) ?? undefined,
    p_to: bangkokDay(p.to, 1) ?? undefined,
    p_before_at: cursor ? beforeAt : undefined,
    p_before_id: cursor ? beforeId : undefined,
    p_limit: PAGE,
  });
  const log: Entry[] = data ?? [];

  const href = (change: Partial<Params>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ actor, target, entity, from: p.from, to: p.to, ...change })) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  };
  const actorName = actor && log.find((e) => e.actor_user_id === actor)?.actor_name;
  const targetName = target && log.find((e) => e.target_user_id === target)?.target_name;
  const last = log.at(-1);

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Audit log</h1>
    </div>

    <form className={`panel pixel-4 ${styles.search}`}>
      {actor && <input type="hidden" name="actor" value={actor} />}
      {target && <input type="hidden" name="target" value={target} />}
      <div className={styles.searchRow}>
        <label className="stack gap-6">
          <span className="label">Area</span>
          <select className="input" name="entity" defaultValue={entity ?? ""}>
            <option value="">Everything</option>
            {Object.entries(ENTITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="stack gap-6">
          <span className="label">From</span>
          <input className="input" type="date" name="from" defaultValue={p.from} />
        </label>
        <label className="stack gap-6">
          <span className="label">To</span>
          <input className="input" type="date" name="to" defaultValue={p.to} />
        </label>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: "end" }}>Filter</button>
      </div>
      {(actor || target) && (
        <p className="field-help">
          {actor && <>By <strong>{actorName ?? "this admin"}</strong> <Link href={href({ actor: undefined, before: undefined })}>clear</Link> </>}
          {target && <>For <strong>{targetName ?? "this player"}</strong> <Link href={href({ target: undefined, before: undefined })}>clear</Link></>}
        </p>
      )}
    </form>

    <section aria-labelledby="audit-title" className="panel">
      <div className={styles.listHead}>
        <h2 id="audit-title">{cursor ? "Older actions" : "Newest actions"}</h2>
        <span className="hint">Times in Bangkok</span>
      </div>
      {error ? (
        <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the audit log. Please reload.</p></div>
      ) : log.length === 0 ? <p className="muted">No admin actions match.</p> : (
        <ol className={styles.log}>
          {log.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.created_at}>{when(entry.created_at)}</time>
              <span>
                <Link href={href({ actor: entry.actor_user_id ?? undefined, before: undefined })}><strong>{entry.actor_name ?? "A removed admin"}</strong></Link>{" "}
                <span className="muted">{describeChange(entry.field, entry.old_value, entry.new_value)}</span>
                {entry.target_user_id !== entry.actor_user_id && <>
                  <span className="muted"> for</span>{" "}
                  <Link href={`/admin/users/${entry.target_user_id}`}>{entry.target_name ?? "a player"}</Link>{" "}
                  <Link href={href({ target: entry.target_user_id, before: undefined })} className="hint">(filter)</Link>
                </>}
                <span className="hint"> · {ENTITIES[entry.entity] ?? entry.entity}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={styles.listHead}>
        {cursor ? <Link href={href({ before: undefined })}>← Newest</Link> : <span />}
        {last && log.length === PAGE && <Link href={href({ before: `${last.created_at}_${last.id}` })}>Older →</Link>}
      </div>
    </section>
  </>;
}
