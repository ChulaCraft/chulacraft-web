import { timed } from "@/lib/perf";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartFrame } from "@/components/charts/chart-frame";
import { Sparkline } from "@/components/charts/sparkline";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { PERMISSION, maskFor } from "@/lib/mcsv-token";
import { SERVICE_ID, managerFetch, opsGrant, parseImage, parseMetrics, parseServices, parseStatus, type MetricPoint, type Service } from "@/lib/ops";
import adminStyles from "../../admin.module.css";
import { myRole } from "../../staff-gate";
import { opsAction } from "../actions";
import { Outcome, StatusChip, bytes, percent, sinceLine, stamp } from "../ops-ui";
import styles from "../ops.module.css";
import { ServiceConsole } from "../service-console";

export const metadata: Metadata = { title: "Ops" };

/** "minecraft%40survival" from our own links; a malformed escape stays raw and fails SERVICE_ID. */
function decoded(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const settled = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);

/** One STATUS|LOGS token for everything the page reads. Each panel settles on
 *  its own, so one failing endpoint only blanks its own panel. null when the
 *  manager itself can't be reached; "missing" when it doesn't list this id. */
async function load(id: string, logs: boolean) {
  try {
    const token = await timed("opsGrant", opsGrant("status", PERMISSION.STATUS | (logs ? PERMISSION.LOGS : 0), id));
    if (!token) return null;
    const service = parseServices(await (await timed("managerFetch " + "/services", managerFetch("/services", token))).json()).find((s) => s.id === id);
    if (!service) return "missing" as const;
    const get = (path: string) => timed(`managerFetch ${path.split("?")[0]}`, managerFetch(`/service/${id}/${path}`, token)).then((r) => r.json());
    const [status, metrics, image, rlog] = await Promise.allSettled([
      get("status").then(parseStatus),
      get("metrics?hours=24").then(parseMetrics),
      service.updatable ? get("image").then(parseImage) : Promise.resolve(null),
      // rlog is newest first.
      logs ? get("rlog?max_lines=200").then((rows: unknown) => (Array.isArray(rows) ? rows.map((l) => String(l?.message ?? "")).reverse() : [])) : Promise.resolve([])
    ]);
    return { service, status: settled(status), metrics: settled(metrics), image: settled(image), lines: settled(rlog) };
  } catch {
    return null;
  }
}

export default async function OpsServicePage({ params, searchParams }: {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const [{ service: raw }, { error, done }] = await Promise.all([params, searchParams]);
  const id = decoded(raw);
  if (!SERVICE_ID.test(id)) notFound();
  const mask = maskFor(await timed("myRole", myRole()));
  const can = (bit: number) => (mask & bit) === bit;
  const data = await load(id, can(PERMISSION.LOGS));
  if (data === "missing") notFound();

  const back = <Link href="/admin/ops" className={styles.back}><PixelIcon name="back" />All services</Link>;
  if (!data) return <div className={styles.page}>
    {back}
    <h1 className={adminStyles.title}>{id}</h1>
    <Outcome error={error} done={done} />
    <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t reach the server manager. Reload to try again.</p></div>
  </div>;

  const { service, status, metrics, image, lines } = data;
  return <div className={styles.page}>
    {back}
    <div className={styles.detailHead}>
      <h1 className={adminStyles.title}>{service.name}</h1>
      <span className="badge badge-muted">{service.kind}</span>
      <StatusChip state={status ? status.state : "error"} />
    </div>
    <Outcome error={error} done={done} />

    <section aria-label="Status" className={styles.panel}>
      {status ? <>
        <p>{sinceLine(status)}</p>
        <dl className={styles.facts}>
          <div><dt>CPU now</dt><dd>{status.state === "up" ? percent(status.cpu_pct) : "–"}</dd></div>
          <div><dt>Memory now</dt><dd>{status.state === "up" ? `${bytes(status.mem_bytes)}${status.mem_limit_bytes ? ` of ${bytes(status.mem_limit_bytes)}` : ""}` : "–"}</dd></div>
        </dl>
      </> : <p className={styles.small}>Couldn&apos;t load status. The other panels may still work.</p>}
      <Actions service={service} can={can} />
    </section>

    <section aria-label="Usage, last 24 hours">
      <h2 className={adminStyles.sectionTitle}>Last 24 hours</h2>
      {!metrics ? <p className={styles.small}>Couldn&apos;t load usage history.</p> : (
        <div className={styles.charts}>
          <Usage title="CPU, last 24 hours" points={metrics} pick={(p) => p.cpu_pct} format={percent} csv={`${service.id}-cpu`} />
          <Usage title="Memory, last 24 hours" points={metrics} pick={(p) => p.mem_bytes} format={bytes} csv={`${service.id}-memory`} />
        </div>
      )}
    </section>

    {service.updatable && (
      <section aria-label="Image" className={styles.panel}>
        <h2 className={adminStyles.sectionTitle}>Image</h2>
        {!image ? <p className={styles.small}>Couldn&apos;t load the image tags.</p> : <>
          <dl className={styles.facts}>
            <div><dt>Running</dt><dd className="mono">{image.current}</dd></div>
            <div><dt>Latest</dt><dd className="mono">{image.latest}</dd></div>
          </dl>
          <p className={styles.small}>
            {image.current === image.latest ? "Up to date." : "A newer image is available."} Checked {stamp(image.checked_at)}.
          </p>
          {can(PERMISSION.UPDATE) && (
            <div className={adminStyles.actions}>
              <ConfirmAction action={opsAction} fields={{ service: service.id, action: "update" }}
                trigger={<><PixelIcon name="retry" />Pull &amp; restart</>} triggerClassName="btn btn-sm"
                title={`Pull & restart ${service.name}?`} body={`Everyone using ${service.name} is disconnected while it restarts.`}
                confirmLabel="Pull & restart" />
            </div>
          )}
        </>}
      </section>
    )}

    {service.console && can(PERMISSION.CONSOLE_READ) ? (
      <ServiceConsole key={service.id} service={service.id} name={service.name} initial={lines ?? []} canWrite={can(PERMISSION.CONSOLE_WRITE)} />
    ) : can(PERMISSION.LOGS) && (
      <section aria-label="Recent logs">
        <h2 className={adminStyles.sectionTitle}>Recent logs</h2>
        {!lines ? <p className={styles.small}>Couldn&apos;t load the logs.</p>
          : lines.length === 0 ? <p className={styles.small}>No log lines yet.</p>
          : <pre className={adminStyles.console} tabIndex={0} aria-label={`${service.name} log`}>{lines.join("\n")}</pre>}
      </section>
    )}
  </div>;
}

const COPY = {
  start: { title: "Start", body: "starts. Players can join once it shows Up.", danger: false },
  restart: { title: "Restart", body: "restarts. Everyone using it is disconnected; it is usually back within a minute.", danger: false },
  stop: { title: "Stop", body: "stops. Everyone using it is disconnected and it stays off until someone starts it.", danger: true }
} as const;
const BITS = { start: PERMISSION.START, restart: PERMISSION.RESTART, stop: PERMISSION.STOP } as const;

/** Only the actions the service offers and this role's mask allows; each one asks first. */
function Actions({ service, can }: { service: Service; can: (bit: number) => boolean }) {
  const shown = (["start", "restart", "stop"] as const).filter((a) => service.actions.includes(a) && can(BITS[a]));
  if (shown.length === 0) return null;
  return <div className={adminStyles.actions}>
    {shown.map((a) => (
      <ConfirmAction key={a} action={opsAction} fields={{ service: service.id, action: a }}
        trigger={a === "restart" ? <><PixelIcon name="retry" />Restart</> : COPY[a].title}
        triggerClassName={`btn btn-sm${COPY[a].danger ? " btn-danger" : ""}`}
        title={`${COPY[a].title} ${service.name}?`} body={`${service.name} ${COPY[a].body}`}
        confirmLabel={COPY[a].title} confirmClassName={COPY[a].danger ? "btn btn-danger" : undefined} />
    ))}
  </div>;
}

function Usage({ title, points, pick, format, csv }: {
  title: string;
  points: MetricPoint[];
  pick: (p: MetricPoint) => number | null;
  format: (n: number | null) => string;
  csv: string;
}) {
  const values = points.map(pick);
  const last = values.filter((v) => v !== null).at(-1) ?? null;
  return <ChartFrame title={title} csvName={csv} columns={[{ key: "time", label: "Time (Bangkok)" }, { key: "value", label: title.split(",")[0] }]}
    rows={points.map((p) => ({ time: stamp(p.t), value: format(pick(p)) }))}>
    <div className={styles.usage}>
      <span className={styles.usageValue}>{format(last)}</span>
      <Sparkline values={values} label={title} />
    </div>
  </ChartFrame>;
}
