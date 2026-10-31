import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { opsHealth } from "@/lib/ops-health";
import { createClient } from "@/lib/supabase/server";
import adminStyles from "../../admin.module.css";
import { StatusChip, stamp } from "../ops-ui";
import styles from "../ops.module.css";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Website · Ops" };

/** The website's own health (in-process, same as /api/ops/health) and its
 *  errors from the last 24 hours, grouped by fingerprint. */
export default async function OpsWebsitePage() {
  const supabase = await createClient();
  const [health, errors] = await Promise.all([timed("opsHealth", opsHealth()), timed("admin_app_errors", supabase.rpc("admin_app_errors", { p_hours: 24 }))]);
  const rows = errors.error ? null : errors.data ?? [];

  return <div className={styles.page}>
    <Link href="/admin/ops" className={styles.back}><PixelIcon name="back" />All services</Link>
    <div className={styles.detailHead}>
      <h1 className={adminStyles.title}>Website</h1>
      <span className="badge badge-muted">vercel</span>
      <StatusChip state={health.ok ? "up" : "down"} />
    </div>

    <section aria-label="Health" className={styles.panel}>
      <dl className={styles.facts}>
        <div><dt>Database</dt><dd>{health.db === "ok" ? "Reachable" : "Unreachable"}</dd></div>
        <div><dt>Errors, last 5 min</dt><dd>{health.errors_5m}</dd></div>
        <div><dt>Version</dt><dd className="mono">{health.version}</dd></div>
      </dl>
      <p className={styles.small}>The Discord bot&apos;s status monitor checks this every minute and alerts when it fails or errors spike.</p>
    </section>

    <section aria-label="Errors, last 24 hours">
      <h2 className={adminStyles.sectionTitle}>Errors, last 24 hours</h2>
      {!rows ? (
        <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the error feed. Reload to try again.</p></div>
      ) : rows.length === 0 ? (
        <div className={adminStyles.empty}><p className="section-title">No errors in the last 24 hours</p><p className="muted">Server and browser errors show up here, grouped by message and place.</p></div>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={`${adminStyles.table} ${styles.errors}`}>
            <caption className="sr-only">Errors in the last 24 hours, newest first</caption>
            <thead><tr><th scope="col">Message</th><th scope="col">Route</th><th scope="col">Count</th><th scope="col">Last seen</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.fingerprint}>
                  <td>{e.message}</td>
                  <td className="mono">{e.route ?? "–"}<span className={styles.kind}> · {e.kind}</span></td>
                  <td>{Number(e.n).toLocaleString("en")}</td>
                  <td>{stamp(e.last_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>;
}
