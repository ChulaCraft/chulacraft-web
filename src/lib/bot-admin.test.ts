import { describe, expect, it } from "vitest";
import { type BotJob, jobState, nextRun, validateSettingValue, worstJobState } from "./bot-admin";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const ago = (s: number) => new Date(NOW - s * 1000).toISOString();

function job(over: Partial<BotJob> = {}): BotJob {
  return {
    name: "status_monitor", label: "Status monitor", interval_seconds: 60, enabled: true,
    last_started_at: ago(10), last_finished_at: ago(9), last_ok: true, last_items: 0, last_error: null,
    consecutive_failures: 0, registered_at: ago(3600), retired_at: null, runs: [], ...over
  };
}

describe("jobState", () => {
  it("is ok after a recent good run, failing after a bad one", () => {
    expect(jobState(job(), NOW)).toBe("ok");
    expect(jobState(job({ last_ok: false, consecutive_failures: 1 }), NOW)).toBe("failing");
  });

  it("paused beats overdue, and retired beats everything", () => {
    const stale = { last_started_at: ago(3600) };
    expect(jobState(job(stale), NOW)).toBe("overdue");
    expect(jobState(job({ ...stale, enabled: false }), NOW)).toBe("paused");
    expect(jobState(job({ ...stale, enabled: false, retired_at: ago(5) }), NOW)).toBe("retired");
    expect(jobState(job({ last_ok: false, retired_at: ago(5) }), NOW)).toBe("retired");
  });

  it("is overdue at 3 × interval + 1 s, not at 3 × interval", () => {
    expect(jobState(job({ last_started_at: ago(180) }), NOW)).toBe("ok");
    expect(jobState(job({ last_started_at: ago(181) }), NOW)).toBe("overdue");
  });

  it("is never while a new job is younger than 3 × interval, then overdue", () => {
    const fresh = { last_started_at: null, last_finished_at: null, last_ok: null, last_items: null };
    expect(jobState(job({ ...fresh, registered_at: ago(100) }), NOW)).toBe("never");
    expect(jobState(job({ ...fresh, registered_at: ago(181) }), NOW)).toBe("overdue");
  });

  it("never calls an event-driven job overdue", () => {
    expect(jobState(job({ interval_seconds: null, last_started_at: ago(86_400 * 30) }), NOW)).toBe("ok");
    expect(jobState(job({ interval_seconds: null, last_started_at: null, last_ok: null, registered_at: ago(86_400) }), NOW)).toBe("never");
  });
});

describe("nextRun", () => {
  it("is the last start plus the interval", () => {
    expect(nextRun(job({ last_started_at: "2026-10-22T11:59:30.000Z" }))).toBe("2026-10-22T12:00:30.000Z");
  });

  it("is null when paused, event-driven, or never run", () => {
    expect(nextRun(job({ enabled: false }))).toBeNull();
    expect(nextRun(job({ interval_seconds: null }))).toBeNull();
    expect(nextRun(job({ last_started_at: null }))).toBeNull();
  });
});

describe("worstJobState", () => {
  it("picks the worst live job and ignores retired ones", () => {
    expect(worstJobState([job(), job({ enabled: false }), job({ last_ok: false })], NOW)).toBe("failing");
    expect(worstJobState([job({ last_ok: false }), job({ last_started_at: ago(3600) })], NOW)).toBe("overdue");
    expect(worstJobState([job(), job({ retired_at: ago(1), last_started_at: ago(3600) })], NOW)).toBe("ok");
    expect(worstJobState([job({ retired_at: ago(1) })], NOW)).toBeNull();
    expect(worstJobState([], NOW)).toBeNull();
  });
});

// Mirrors admin_set_bot_setting (20261031000003); the database stays the final check.
describe("validateSettingValue", () => {
  const id = "1234567890123456789";

  it("treats blank as a reset to the default", () => {
    expect(validateSettingValue("channel", "  ")).toEqual({ ok: true, value: null });
  });

  it("wants 17 to 20 digits for guild, channel and role", () => {
    for (const kind of ["guild", "channel", "role"] as const) {
      expect(validateSettingValue(kind, id)).toEqual({ ok: true, value: id });
      expect(validateSettingValue(kind, "123").ok).toBe(false);
      expect(validateSettingValue(kind, `${id}1a`).ok).toBe(false);
    }
  });

  it("takes up to 25 comma-separated IDs, stored without spaces", () => {
    expect(validateSettingValue("role_list", `${id}, ${id.replace("9", "8")}`)).toEqual({ ok: true, value: `${id},${id.replace("9", "8")}` });
    expect(validateSettingValue("user_list", Array(25).fill(id).join(",")).ok).toBe(true);
    expect(validateSettingValue("user_list", Array(26).fill(id).join(",")).ok).toBe(false);
    expect(validateSettingValue("role_list", `${id},,${id}`).ok).toBe(false);
  });

  it("allows only http(s) URLs up to 300 characters", () => {
    expect(validateSettingValue("url", "https://chulacraft.com/").ok).toBe(true);
    expect(validateSettingValue("url", "javascript:alert(1)").ok).toBe(false);
    expect(validateSettingValue("url", `https://a.com/${"x".repeat(300)}`).ok).toBe(false);
    expect(validateSettingValue("url", "https://a.com/ b").ok).toBe(false);
  });

  it("wants an integer inside min..max for numbers", () => {
    expect(validateSettingValue("number", "60000", { min: 10000 })).toEqual({ ok: true, value: "60000" });
    expect(validateSettingValue("number", "5000", { min: 10000 }).ok).toBe(false);
    expect(validateSettingValue("number", "11", { max: 10 }).ok).toBe(false);
    expect(validateSettingValue("number", "1.5").ok).toBe(false);
  });

  it("takes true/false, short single-line text, and short text lists", () => {
    expect(validateSettingValue("boolean", "TRUE")).toEqual({ ok: true, value: "true" });
    expect(validateSettingValue("boolean", "yes").ok).toBe(false);
    expect(validateSettingValue("text", "mc.chulacraft.com").ok).toBe(true);
    expect(validateSettingValue("text", "a\nb").ok).toBe(false);
    expect(validateSettingValue("text", "x".repeat(501)).ok).toBe(false);
    expect(validateSettingValue("text_list", "openrouter/free, google/gemma:free")).toEqual({ ok: true, value: "openrouter/free,google/gemma:free" });
    expect(validateSettingValue("text_list", Array(26).fill("m").join(",")).ok).toBe(false);
    expect(validateSettingValue("text_list", "x".repeat(121)).ok).toBe(false);
  });
});
