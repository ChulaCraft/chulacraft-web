import type { Metadata } from "next";
import Link from "next/link";
import { MetricTile } from "@/components/charts/metric-tile";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { type BotJob, type BotOverview, type BotSetting, type SettingKind, every, jobState, nextRun, relative, settingRule } from "@/lib/bot-admin";
import { createClient } from "@/lib/supabase/server";
import adminStyles from "../../admin.module.css";
import { JobChip, stamp } from "../ops-ui";
import styles from "../ops.module.css";
import { saveBotSetting, setBotJobEnabled } from "./actions";
import { RefreshWhile } from "./refresh-while";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Discord bot · Ops" };

// The bot's Docker service in the manager's config; restart-only settings link there.
const BOT_SERVICE = "/admin/ops/discord-bot";

const GROUPS: { title: string; kinds: SettingKind[] }[] = [
  { title: "Server", kinds: ["guild"] },
  { title: "Channels", kinds: ["channel"] },
  { title: "Roles", kinds: ["role", "role_list"] },
  { title: "People", kinds: ["user_list"] },
  { title: "Links", kinds: ["url"] },
  { title: "Numbers", kinds: ["number"] },
  { title: "Switches", kinds: ["boolean"] },
  { title: "Text", kinds: ["text", "text_list"] }
];

const SETTING_ERRORS: Record<string, string> = {
  FORBIDDEN: "Only owners and admins can change the bot's settings.",
  NOT_FOUND: "The bot no longer registers this setting. Reload the page.",
  RETIRED: "The bot no longer uses this setting, so it can't be changed.",
  ROLE_IN_USE_BY_BADGE: "A badge may give that role (Settings → Discord roles badges may give). Pick a role the bot owns, or take it off that list first.",
  FAILED: "The setting couldn't be saved. Please try again."
};
const JOB_ERRORS: Record<string, string> = {
  FORBIDDEN: "Only owners and admins can pause or resume the bot's tasks.",
  NOT_FOUND: "The bot no longer registers that task. Reload the page.",
  RETIRED: "The bot no longer runs that task.",
  INVALID: "That didn't work. Reload the page and try again.",
  FAILED: "The task couldn't be changed. Please try again."
};

type Search = { key?: string; error?: string; done?: string; job?: string; jobError?: string; jobDone?: string };

async function loadOverview() {
  const supabase = await createClient();
  const { data, error } = await timed("admin_bot_overview", supabase.rpc("admin_bot_overview"));
  return { overview: error ? null : (data as unknown as BotOverview), now: Date.now() };
}

/** Values the bot reads from the database, and every automatic task it runs.
 *  Everything shown is what the bot registered; nothing here names a setting. */
export default async function OpsBotPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const { overview, now } = await loadOverview();

  const head = <>
    <Link href="/admin/ops" className={styles.back}><PixelIcon name="back" />All services</Link>
    <div>
      <h1 className={adminStyles.title}>Discord bot</h1>
      <p className="muted">The bot&apos;s channels, roles and limits, and the tasks it runs on its own. Secrets stay in the bot&apos;s .env and never show here.</p>
    </div>
  </>;
  if (!overview) {
    return <div className={styles.page}>{head}
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load the bot&apos;s settings and tasks. Reload to try again.</p></div>
    </div>;
  }

  const settings = overview.settings.filter((s) => !s.retired_at);
  const jobs = overview.jobs.filter((j) => !j.retired_at);
  const retiredSettings = overview.settings.filter((s) => s.retired_at);
  const retiredJobs = overview.jobs.filter((j) => j.retired_at);
  // A saved value waits for the bot's check; keep re-reading for 2 minutes.
  const waiting = settings.some((s) => s.bot_status === null && s.updated_at && now - Date.parse(s.updated_at) < 120_000);
  const { backlog } = overview;

  return <div className={styles.page}>
    <RefreshWhile active={waiting} />
    {head}

    <section aria-label="Queues">
      <div className={styles.tiles}>
        <MetricTile label="Badge role changes waiting" value={backlog.role_changes >= 100 ? "100+" : backlog.role_changes} delta={null} />
        <MetricTile label="Announcements to post" value={backlog.announcements >= 20 ? "20+" : backlog.announcements} delta={null} />
        <MetricTile label="Event reminders due" value={backlog.reminders_due} delta={null} />
      </div>
    </section>

    <section aria-labelledby="bot-settings">
      <h2 id="bot-settings" className={adminStyles.sectionTitle}>Settings</h2>
      <p className={styles.small}>The bot applies changes within about a minute. A blank field uses the default from the bot&apos;s .env.</p>
      {settings.length === 0 && <p className={styles.small}>The bot hasn&apos;t registered any settings yet. They appear after it starts.</p>}
      {GROUPS.map((group) => {
        const items = settings.filter((s) => group.kinds.includes(s.kind));
        if (items.length === 0) return null;
        return <fieldset key={group.title} className={styles.group}>
          <legend className={styles.groupTitle}>{group.title}</legend>
          {items.map((s) => <SettingField key={s.key} setting={s} search={search} now={now} />)}
        </fieldset>;
      })}
    </section>

    <section aria-labelledby="bot-tasks">
      <h2 id="bot-tasks" className={adminStyles.sectionTitle}>Automatic tasks</h2>
      <div aria-live="polite">
        {search.jobError && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{JOB_ERRORS[search.jobError] ?? JOB_ERRORS.FAILED}</p></div>}
        {search.jobDone && (search.jobDone === "paused" || search.jobDone === "resumed") && (
          <p className="alert alert-success" role="status"><PixelIcon name="check" />
            {search.jobDone === "paused" ? "Paused. The bot skips it from its next poll." : "Resumed. The bot runs it again from its next poll."}
          </p>
        )}
      </div>
      {jobs.length === 0 ? (
        <p className={styles.small}>The bot hasn&apos;t registered any tasks yet. They appear after it starts.</p>
      ) : (
        <div className={`${adminStyles.tableWrap} ${styles.tableGap}`}>
          <table className={`${adminStyles.table} ${styles.jobs}`}>
            <caption className="sr-only">Automatic tasks the bot runs</caption>
            <thead><tr><th scope="col">Task</th><th scope="col">Last run</th><th scope="col">State</th></tr></thead>
            {jobs.map((job) => <JobRows key={job.name} job={job} now={now} />)}
          </table>
        </div>
      )}
      <p className={styles.small}>A task with a schedule is Overdue when it hasn&apos;t started for 3 of its intervals. The bot can&apos;t alert about itself, so check here and the bot&apos;s <Link href={BOT_SERVICE}>container status</Link>.</p>
    </section>

    {(retiredSettings.length > 0 || retiredJobs.length > 0) && (
      <details className={styles.retired} data-retired>
        <summary>Retired: {retiredSettings.length} setting{retiredSettings.length === 1 ? "" : "s"}, {retiredJobs.length} task{retiredJobs.length === 1 ? "" : "s"} the bot no longer sends</summary>
        <ul className={styles.retiredList}>
          {retiredSettings.map((s) => <li key={s.key}>{s.label} <span className="mono">{s.key}</span>{s.value !== null && <> · last value <span className="mono">{s.value}</span></>} · since {stamp(s.retired_at)}</li>)}
          {retiredJobs.map((j) => <li key={j.name}>{j.label} <span className="mono">{j.name}</span> · last run {relative(j.last_started_at, now)} · since {stamp(j.retired_at)}</li>)}
        </ul>
      </details>
    )}
  </div>;
}

const NOUN: Partial<Record<SettingKind, string>> = { guild: "server", channel: "channel", role: "role", role_list: "role", user_list: "user" };

function CheckLine({ setting }: { setting: BotSetting }) {
  if (setting.bot_status === "ok") {
    return <p className={styles.check} data-check><span className="badge badge-green" data-status-chip><PixelIcon name="check" />OK</span>
      <span className={styles.small}>Bot checked {stamp(setting.checked_at)}</span></p>;
  }
  if (setting.bot_status === "invalid") {
    const noun = NOUN[setting.kind];
    return <p className={styles.check} data-check><span className="badge badge-danger" data-status-chip><PixelIcon name="warning" />
      {noun ? `Bot can't find this ${noun}` : "Bot rejected this value"}: {setting.bot_error ?? "no reason given"}</span></p>;
  }
  return <p className={styles.check} data-check><span className="badge badge-muted" data-status-chip><PixelIcon name="clock" />Waiting for the bot to check</span></p>;
}

function SettingField({ setting: s, search, now }: { setting: BotSetting; search: Search; now: number }) {
  const id = `setting-${s.key}`;
  const mine = search.key === s.key;
  const error = mine ? search.error : undefined;
  const limits = { min: s.min_value, max: s.max_value };
  const describedBy = [`${id}-help`, error ? `${id}-error` : ""].filter(Boolean).join(" ");
  // Inputs are keyed on the stored value: a save or reset elsewhere remounts them,
  // since an uncontrolled input ignores a new defaultValue.
  const common = { id: `${id}-input`, name: "value", "aria-describedby": describedBy, "aria-invalid": error ? true : undefined } as const;

  return <div className={styles.setting} id={id} data-setting={s.key}>
    <form action={saveBotSetting} className={styles.settingForm}>
      <input type="hidden" name="key" value={s.key} />
      <input type="hidden" name="kind" value={s.kind} />
      {s.min_value !== null && <input type="hidden" name="min" value={s.min_value} />}
      {s.max_value !== null && <input type="hidden" name="max" value={s.max_value} />}
      <label htmlFor={common.id} className={styles.settingLabel}>{s.label}</label>
      <div className={styles.settingRow}>
        {s.kind === "boolean" ? (
          <select {...common} key={s.value ?? ""} className="input" defaultValue={s.value ?? ""}>
            <option value="">Default ({s.default_value ?? "not set"})</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input {...common} key={s.value ?? ""} className={`input${s.kind === "text" || s.kind === "text_list" || s.kind === "url" ? "" : " mono"}`}
            type="text" defaultValue={s.value ?? ""} placeholder={s.default_value ?? "Not set"} autoComplete="off" spellCheck="false"
            inputMode={["guild", "channel", "role", "number"].includes(s.kind) ? "numeric" : s.kind === "url" ? "url" : undefined}
            maxLength={s.kind === "url" ? 300 : s.kind === "text" ? 500 : 4000} />
        )}
        <SubmitButton className="btn btn-sm btn-primary">Save</SubmitButton>
      </div>
    </form>
    <div id={`${id}-help`} className={styles.small}>
      {s.description && <p>{s.description}</p>}
      <p>Default: <span className="mono">{s.default_value ?? "not set"}</span>
        {s.updated_by_name && s.updated_at && <> · Changed by {s.updated_by_name}, {stamp(s.updated_at)} ({relative(s.updated_at, now)})</>}</p>
    </div>
    {s.applies === "restart" && (
      <p className={styles.small}><PixelIcon name="info" /> Applies after the bot restarts. <Link href={BOT_SERVICE}>Restart the bot on its Ops page</Link>.</p>
    )}
    <CheckLine setting={s} />
    <div aria-live="polite">
      {error && <div id={`${id}-error`} className="alert alert-error" role="alert"><PixelIcon name="warning" />
        <p className="alert-body">{error === "INVALID" ? settingRule(s.kind, limits) : SETTING_ERRORS[error] ?? SETTING_ERRORS.FAILED}</p></div>}
      {mine && search.done === "saved" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Saved. The bot picks it up within about a minute.</p>}
      {mine && search.done === "reset" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Back to the default. The bot picks it up within about a minute.</p>}
    </div>
    {s.value !== null && (
      <form action={saveBotSetting}>
        <input type="hidden" name="key" value={s.key} />
        <input type="hidden" name="reset" value="1" />
        <SubmitButton className="btn btn-sm" aria-label={`Reset to default: ${s.label}`}>Reset to default</SubmitButton>
      </form>
    )}
  </div>;
}

function lastRun(job: BotJob, now: number) {
  if (!job.last_started_at) return "Never";
  const result = job.last_ok ? `OK${job.last_items !== null ? ` · ${job.last_items} item${job.last_items === 1 ? "" : "s"}` : ""}`
    : `Failed${job.consecutive_failures > 1 ? ` (${job.consecutive_failures} in a row)` : ""}: ${job.last_error ?? "no reason given"}`;
  return `${relative(job.last_started_at, now)} · ${result}`;
}

function JobRows({ job, now }: { job: BotJob; now: number }) {
  const state = jobState(job, now);
  const next = nextRun(job);
  return <tbody>
    <tr data-job={job.name}>
      <td>
        <strong>{job.label}</strong>
        <span className={styles.cellNote}>
          {job.interval_seconds === null ? "On events" : every(job.interval_seconds)}
          {next && ` · next ${relative(next, now)}`}
        </span>
      </td>
      <td className={styles.lastRun}>{lastRun(job, now)}</td>
      <td>
        <div className={styles.stateCell}>
          <JobChip state={state} />
          <ConfirmAction action={setBotJobEnabled} fields={{ name: job.name, enabled: job.enabled ? "false" : "true" }}
            trigger={job.enabled ? "Pause" : "Resume"} triggerClassName="btn btn-sm"
            title={`${job.enabled ? "Pause" : "Resume"} ${job.label}?`}
            body={job.enabled ? "The bot skips this task from its next poll until someone resumes it." : "The bot runs this task again from its next poll."}
            confirmLabel={job.enabled ? "Pause" : "Resume"} />
        </div>
      </td>
    </tr>
    <tr className={styles.runsRow}>
      <td colSpan={3}>
        <details>
          <summary>Last runs: {job.label}</summary>
          {job.runs.length === 0 ? <p className={styles.small}>No runs reported yet.</p> : (
            <table className={adminStyles.table}>
              <caption className="sr-only">Last runs of {job.label}</caption>
              <thead><tr><th scope="col">Started</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {job.runs.map((run, i) => (
                  <tr key={`${run.started_at}-${i}`}>
                    <td>{stamp(run.started_at)} <span className={styles.cellNote}>{relative(run.started_at, now)}</span></td>
                    <td>{run.ok ? `OK${run.items !== null ? ` · ${run.items} item${run.items === 1 ? "" : "s"}` : ""}` : `Failed: ${run.error ?? "no reason given"}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </details>
      </td>
    </tr>
  </tbody>;
}
