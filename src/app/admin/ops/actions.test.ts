import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  opsGrant: vi.fn<(action: string, need: number, service: string) => Promise<string | null>>(),
  managerFetch: vi.fn<(path: string, token: string, init?: RequestInit) => Promise<Response>>()
}));

vi.mock("@/lib/ops", async (original) => ({ ...(await original<typeof import("@/lib/ops")>()), opsGrant: m.opsGrant, managerFetch: m.managerFetch }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { openConsole, opsAction } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const redirected = (data: FormData) => opsAction(data).then(() => null, (error: Error) => error.message);
const BACK = "NEXT_REDIRECT:/admin/ops/survival";

describe("ops actions", () => {
  beforeEach(() => {
    m.opsGrant.mockReset().mockResolvedValue("tok");
    m.managerFetch.mockReset().mockResolvedValue(new Response(null, { status: 202 }));
  });

  it("POSTs a restart with a token carrying only the RESTART bit", async () => {
    expect(await redirected(form({ service: "survival", action: "restart" }))).toBe(`${BACK}?done=restart`);
    expect(m.opsGrant).toHaveBeenCalledWith("restart", 64, "survival");
    expect(m.managerFetch).toHaveBeenCalledWith("/service/survival/restart", "tok", { method: "POST" });
  });

  it("pulls and restarts with only the UPDATE bit", async () => {
    expect(await redirected(form({ service: "discord-bot", action: "update" }))).toBe("NEXT_REDIRECT:/admin/ops/discord-bot?done=update");
    expect(m.opsGrant).toHaveBeenCalledWith("update", 512, "discord-bot");
    expect(m.managerFetch).toHaveBeenCalledWith("/service/discord-bot/update", "tok", { method: "POST" });
  });

  it("starts a backup of one target and comes back to the list", async () => {
    expect(await redirected(form({ action: "backup", target: "world" }))).toBe("NEXT_REDIRECT:/admin/ops?done=backup");
    expect(m.opsGrant).toHaveBeenCalledWith("backup_run", 256, "world");
    expect(m.managerFetch).toHaveBeenCalledWith("/backups", "tok", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "world" })
    });
  });

  it("starts a bot backup", async () => {
    expect(await redirected(form({ action: "backup", target: "bot" }))).toBe("NEXT_REDIRECT:/admin/ops?done=backup");
    expect(m.opsGrant).toHaveBeenCalledWith("backup_run", 256, "bot");
    expect(m.managerFetch).toHaveBeenCalledWith("/backups", "tok", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "bot" })
    });
  });

  it("never reaches the manager for a bad service, target or action", async () => {
    for (const fields of <Record<string, string>[]>[
      { service: "../status", action: "restart" }, { service: "..", action: "restart" }, { service: "survival", action: "cmd" },
      { service: "survival", action: "toString" }, { action: "backup", target: "/etc" }, { action: "backup" }
    ]) expect(await redirected(form(fields))).toBe("NEXT_REDIRECT:/admin/ops");
    expect(m.opsGrant).not.toHaveBeenCalled();
  });

  it("stops at a refused grant, and reports each manager error code", async () => {
    m.opsGrant.mockResolvedValueOnce(null);
    expect(await redirected(form({ service: "survival", action: "stop" }))).toBe(`${BACK}?error=FORBIDDEN`);
    expect(m.managerFetch).not.toHaveBeenCalled();
    m.managerFetch.mockRejectedValueOnce(new Error("MANAGER_409"));
    expect(await redirected(form({ service: "survival", action: "start" }))).toBe(`${BACK}?error=MANAGER_409`);
    m.managerFetch.mockRejectedValueOnce(new Error("MANAGER_502"));
    expect(await redirected(form({ service: "survival", action: "start" }))).toBe(`${BACK}?error=MANAGER`);
    m.managerFetch.mockRejectedValueOnce(new Error("MANAGER_409"));
    expect(await redirected(form({ action: "backup", target: "supabase" }))).toBe("NEXT_REDIRECT:/admin/ops?error=MANAGER_409");
  });

  it("opens the console as a WebSocket subprotocol, asking for write only when wanted", async () => {
    expect(await openConsole("survival", false)).toEqual({
      url: "wss://mc.chulacraft.com/api/mcsv_manager/service/survival/console", protocols: ["mcsv.jwt", "tok"]
    });
    expect(m.opsGrant).toHaveBeenLastCalledWith("console", 4, "survival");
    await openConsole("survival", true);
    expect(m.opsGrant).toHaveBeenLastCalledWith("console_write", 12, "survival");
    m.opsGrant.mockResolvedValueOnce(null);
    expect(await openConsole("survival", true)).toBeNull();
    expect(await openConsole("a/b", false)).toBeNull();
  });
});
