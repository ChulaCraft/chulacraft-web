// /admin/ops/bot: the shapes admin_bot_overview() returns (20261031000003), a
// job's state, and the per-kind value rules. The database is the real check;
// validateSettingValue mirrors admin_set_bot_setting so the form can say what
// is wrong before a round trip.

export type SettingKind = "guild" | "channel" | "role" | "role_list" | "user_list" | "url" | "number" | "boolean" | "text" | "text_list";

export type BotSetting = {
  key: string;
  kind: SettingKind;
  applies: "live" | "restart";
  min_value: number | null;
  max_value: number | null;
  label: string;
  description: string;
  default_value: string | null;
  value: string | null;
  updated_by_name: string | null;
  updated_at: string | null;
  bot_status: "ok" | "invalid" | null;
  bot_error: string | null;
  checked_at: string | null;
  retired_at: string | null;
};

export type BotJobRun = { started_at: string; finished_at: string | null; ok: boolean; items: number | null; error: string | null };

export type BotJob = {
  name: string;
  label: string;
  interval_seconds: number | null;
  enabled: boolean;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_ok: boolean | null;
  last_items: number | null;
  last_error: string | null;
  consecutive_failures: number;
  registered_at: string;
  retired_at: string | null;
  runs: BotJobRun[];
};

export type BotOverview = {
  settings: BotSetting[];
  jobs: BotJob[];
  backlog: { role_changes: number; announcements: number; reminders_due: number };
};

export type JobState = "ok" | "failing" | "overdue" | "paused" | "never" | "retired";

/**
 * Retired beats everything, then paused. An interval job is overdue once its
 * last start (or, before its first run, its registration) is more than
 * 3 × interval ago. Event-driven jobs (no interval) are never overdue.
 */
export function jobState(job: BotJob, now = Date.now()): JobState {
  if (job.retired_at) return "retired";
  if (!job.enabled) return "paused";
  if (job.interval_seconds !== null) {
    const since = Date.parse(job.last_started_at ?? job.registered_at);
    if (now - since > 3 * job.interval_seconds * 1000) return "overdue";
  }
  if (!job.last_started_at) return "never";
  return job.last_ok === false ? "failing" : "ok";
}

/** Last start + interval; null when paused, event-driven or never run. */
export function nextRun(job: BotJob): string | null {
  if (!job.enabled || job.retired_at || job.interval_seconds === null || !job.last_started_at) return null;
  return new Date(Date.parse(job.last_started_at) + job.interval_seconds * 1000).toISOString();
}

const WORST: JobState[] = ["overdue", "failing", "never", "paused", "ok"];

/** The worst state among jobs that aren't retired, for the /admin/ops row; null with none. */
export function worstJobState(jobs: BotJob[], now = Date.now()): JobState | null {
  const states = new Set(jobs.map((job) => jobState(job, now)));
  return WORST.find((state) => states.has(state)) ?? null;
}

export type Limits = { min?: number | null; max?: number | null };
export type Checked = { ok: true; value: string | null } | { ok: false };

const ID = /^[0-9]{17,20}$/;
const list = (value: string) => value.split(/\s*,\s*/);

/** Same rules as admin_set_bot_setting. Blank means "reset to the default" (null). */
export function validateSettingValue(kind: SettingKind, raw: string, limits: Limits = {}): Checked {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  const fail: Checked = { ok: false };
  switch (kind) {
    case "guild":
    case "channel":
    case "role":
      return ID.test(value) ? { ok: true, value } : fail;
    case "role_list":
    case "user_list": {
      const items = list(value);
      return items.length <= 25 && items.every((item) => ID.test(item)) ? { ok: true, value: items.join(",") } : fail;
    }
    case "url":
      return /^https?:\/\/\S+$/i.test(value) && value.length <= 300 ? { ok: true, value } : fail;
    case "number": {
      if (!/^-?[0-9]{1,15}$/.test(value)) return fail;
      const n = Number(value);
      if ((limits.min != null && n < limits.min) || (limits.max != null && n > limits.max)) return fail;
      return { ok: true, value: String(n) };
    }
    case "boolean": {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "false" ? { ok: true, value: lower } : fail;
    }
    case "text":
      return value.length <= 500 && !/[\r\n]/.test(value) ? { ok: true, value } : fail;
    case "text_list": {
      const items = list(value);
      return items.length <= 25 && items.every((item) => item.length >= 1 && item.length <= 120 && !/[\r\n]/.test(item))
        ? { ok: true, value: items.join(",") } : fail;
    }
  }
}

/** What a valid value looks like, shown next to a field the server refused. */
export function settingRule(kind: SettingKind, limits: Limits = {}): string {
  switch (kind) {
    case "guild": case "channel": case "role":
      return "Use the 17 to 20 digit ID Discord shows under Copy ID (turn on Developer Mode to see it).";
    case "role_list": case "user_list":
      return "Use up to 25 Discord IDs (17 to 20 digits each), separated by commas.";
    case "url":
      return "Use a full link starting with http:// or https://, up to 300 characters.";
    case "number": {
      const range = limits.min != null && limits.max != null ? ` from ${limits.min} to ${limits.max}`
        : limits.min != null ? ` of at least ${limits.min}` : limits.max != null ? ` of at most ${limits.max}` : "";
      return `Use a whole number${range}.`;
    }
    case "boolean":
      return "Pick true or false.";
    case "text":
      return "Use up to 500 characters on one line.";
    case "text_list":
      return "Use up to 25 items separated by commas, each up to 120 characters.";
  }
}

/** "every 60 s", "every 5 min", "every 2 h". */
export function every(seconds: number) {
  if (seconds % 3600 === 0) return `every ${seconds / 3600} h`;
  if (seconds % 60 === 0 && seconds >= 120) return `every ${seconds / 60} min`;
  return `every ${seconds} s`;
}

/** "12 s ago", "in 40 s", "3 min ago", "2 h ago", "4 d ago"; "–" when unknown. */
export function relative(iso: string | null, now = Date.now()) {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "–";
  const diff = Math.round((now - t) / 1000);
  const abs = Math.abs(diff);
  const text = abs < 60 ? `${abs} s` : abs < 3600 ? `${Math.floor(abs / 60)} min` : abs < 86_400 ? `${Math.floor(abs / 3600)} h` : `${Math.floor(abs / 86_400)} d`;
  return diff >= 0 ? `${text} ago` : `in ${text}`;
}
