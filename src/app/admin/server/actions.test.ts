import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  grant: vi.fn<(action: string, need: number, server: string) => Promise<string | null>>(),
  managerFetch: vi.fn<(path: string, token: string, init?: RequestInit) => Promise<Response>>()
}));

vi.mock("./manager", async (original) => ({ ...(await original<typeof import("./manager")>()), grant: m.grant, managerFetch: m.managerFetch }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { openConsole, serverAction } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
const redirected = (data: FormData) => serverAction(data).then(() => null, (error: Error) => error.message);
const BACK = "NEXT_REDIRECT:/admin/server?server=survival";

describe("server actions", () => {
  beforeEach(() => {
    m.grant.mockReset().mockResolvedValue("tok");
    m.managerFetch.mockReset().mockResolvedValue(new Response(null));
  });

  it("POSTs a restart with a token carrying only the RESTART bit", async () => {
    expect(await redirected(form({ server: "survival", action: "restart" }))).toBe(`${BACK}&done=restart`);
    expect(m.grant).toHaveBeenCalledWith("restart", 64, "survival");
    expect(m.managerFetch).toHaveBeenCalledWith("/server/survival/restart", "tok", { method: "POST" });
  });

  it("never reaches the manager for a bad server name or action", async () => {
    expect(await redirected(form({ server: "../status", action: "restart" }))).toBe("NEXT_REDIRECT:/admin/server");
    expect(await redirected(form({ server: "survival", action: "cmd" }))).toBe("NEXT_REDIRECT:/admin/server");
    expect(await redirected(form({ server: "survival", action: "toString" }))).toBe("NEXT_REDIRECT:/admin/server");
    expect(m.grant).not.toHaveBeenCalled();
  });

  it("stops at a refused grant, and reports a manager failure", async () => {
    m.grant.mockResolvedValueOnce(null);
    expect(await redirected(form({ server: "survival", action: "stop" }))).toBe(`${BACK}&error=FORBIDDEN`);
    expect(m.managerFetch).not.toHaveBeenCalled();
    m.managerFetch.mockRejectedValueOnce(new Error("MANAGER_502"));
    expect(await redirected(form({ server: "survival", action: "start" }))).toBe(`${BACK}&error=MANAGER`);
  });

  it("opens the console as a WebSocket subprotocol, asking for write only when wanted", async () => {
    expect(await openConsole("survival", false)).toEqual({
      url: "wss://mc.chulacraft.com/api/mcsv_manager/server/survival/console", protocols: ["mcsv.jwt", "tok"]
    });
    expect(m.grant).toHaveBeenLastCalledWith("console", 4, "survival");
    await openConsole("survival", true);
    expect(m.grant).toHaveBeenLastCalledWith("console_write", 12, "survival");
    m.grant.mockResolvedValueOnce(null);
    expect(await openConsole("survival", true)).toBeNull();
    expect(await openConsole("a/b", false)).toBeNull();
  });
});
