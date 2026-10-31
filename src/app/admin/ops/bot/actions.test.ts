import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn<(name: string, args: object) => Promise<{ error: { message: string } | null }>>() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { saveBotSetting, setBotJobEnabled } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const to = (p: Promise<void>) => p.then(() => null, (error: Error) => error.message.replace("NEXT_REDIRECT:", ""));
const CHANNEL = "discord_announcement_channel_id";

describe("bot actions", () => {
  beforeEach(() => m.rpc.mockReset().mockResolvedValue({ error: null }));

  it("saves a valid value, trimmed, and comes back to the field", async () => {
    expect(await to(saveBotSetting(form({ key: CHANNEL, kind: "channel", value: " 1234567890123456789 " }))))
      .toBe(`/admin/ops/bot?done=saved&key=${CHANNEL}#setting-${CHANNEL}`);
    expect(m.rpc).toHaveBeenCalledWith("admin_set_bot_setting", { p_key: CHANNEL, p_value: "1234567890123456789" });
  });

  it("stops a malformed value before the database, using the form's limits", async () => {
    expect(await to(saveBotSetting(form({ key: CHANNEL, kind: "channel", value: "123" })))).toBe(`/admin/ops/bot?error=INVALID&key=${CHANNEL}#setting-${CHANNEL}`);
    expect(await to(saveBotSetting(form({ key: "status_monitor_interval_ms", kind: "number", min: "10000", value: "5000" })))).toContain("error=INVALID");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("resets with null, and passes on database codes", async () => {
    expect(await to(saveBotSetting(form({ key: CHANNEL, reset: "1" })))).toContain("done=reset");
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_bot_setting", { p_key: CHANNEL, p_value: null });
    m.rpc.mockResolvedValueOnce({ error: { message: "ROLE_IN_USE_BY_BADGE" } });
    expect(await to(saveBotSetting(form({ key: "verified_role_id", kind: "role", value: "1234567890123456789" })))).toContain("error=ROLE_IN_USE_BY_BADGE");
    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset by peer" } });
    expect(await to(saveBotSetting(form({ key: CHANNEL, kind: "channel", value: "1234567890123456789" })))).toContain("error=FAILED");
  });

  it("refuses a bad key or flag without calling the database", async () => {
    expect(await to(saveBotSetting(form({ key: "../x", value: "1" })))).toBe("/admin/ops/bot");
    expect(await to(setBotJobEnabled(form({ name: "status_monitor", enabled: "maybe" })))).toBe("/admin/ops/bot");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("pauses and resumes a task", async () => {
    expect(await to(setBotJobEnabled(form({ name: "status_monitor", enabled: "false" })))).toBe("/admin/ops/bot?jobDone=paused&job=status_monitor");
    expect(m.rpc).toHaveBeenCalledWith("admin_set_bot_job_enabled", { p_name: "status_monitor", p_enabled: false });
    m.rpc.mockResolvedValueOnce({ error: { message: "RETIRED" } });
    expect(await to(setBotJobEnabled(form({ name: "old_task", enabled: "true" })))).toBe("/admin/ops/bot?jobError=RETIRED&job=old_task");
  });
});
