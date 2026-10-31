import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); }) }));

import { SETTING_DEFAULTS } from "@/lib/site-content";
import { deleteDiscordRole, saveDiscordRole, saveSiteSettings } from "./actions";

const run = (data: FormData) => saveSiteSettings(data).then(() => null, (e: Error) => e.message);

describe("saveSiteSettings", () => {
  beforeEach(() => { m.rpc.mockReset().mockResolvedValue({ error: null }); });

  it("sends every key, and clears values left at the default", async () => {
    const data = new FormData();
    data.set("home_kicker", " Build at ");
    data.set("home_intro", SETTING_DEFAULTS.home_intro);
    data.set("discord_url", SETTING_DEFAULTS.discord_url);
    data.set("reports_open", "on");
    expect(await run(data)).toBe("NEXT_REDIRECT:/admin/settings?done=saved");
    expect(m.rpc).toHaveBeenCalledWith("admin_save_site_settings", { p_settings: {
      home_kicker: "Build at", home_intro: "", server_address: "", discord_url: "",
      registration_open: "false", reports_open: ""
    } });
  });

  it("shows the database's refusal", async () => {
    m.rpc.mockResolvedValue({ error: { message: "INVALID" } });
    expect(await run(new FormData())).toBe("NEXT_REDIRECT:/admin/settings?error=INVALID");
  });
});

const ROLE = "123456789012345678";
const roleForm = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const runRole = (action: (data: FormData) => Promise<void>, data: FormData) => action(data).then(() => null, (e: Error) => e.message);

describe("Discord role allowlist", () => {
  beforeEach(() => { m.rpc.mockReset().mockResolvedValue({ error: null }); });

  it("adds or renames a role", async () => {
    expect(await runRole(saveDiscordRole, roleForm({ roleId: ` ${ROLE} `, label: " Builder " }))).toBe("NEXT_REDIRECT:/admin/settings?role=saved#discord-roles");
    expect(m.rpc).toHaveBeenCalledWith("admin_save_discord_role", { p_role_id: ROLE, p_label: "Builder" });
  });

  it("refuses a malformed id or label without calling the database", async () => {
    for (const fields of [{ roleId: "12", label: "X" }, { roleId: "abc123456789012345", label: "X" }, { roleId: ROLE, label: "  " }, { roleId: ROLE, label: "x".repeat(61) }]) {
      expect(await runRole(saveDiscordRole, roleForm(fields))).toBe("NEXT_REDIRECT:/admin/settings?roleError=INVALID#discord-roles");
    }
    expect(await runRole(deleteDiscordRole, roleForm({ roleId: "<x>" }))).toBe("NEXT_REDIRECT:/admin/settings?roleError=INVALID#discord-roles");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("removes a role, reporting IN_USE while a badge still maps to it", async () => {
    expect(await runRole(deleteDiscordRole, roleForm({ roleId: ROLE }))).toBe("NEXT_REDIRECT:/admin/settings?role=removed#discord-roles");
    expect(m.rpc).toHaveBeenCalledWith("admin_delete_discord_role", { p_role_id: ROLE });

    m.rpc.mockResolvedValue({ error: { message: "IN_USE" } });
    expect(await runRole(deleteDiscordRole, roleForm({ roleId: ROLE }))).toBe("NEXT_REDIRECT:/admin/settings?roleError=IN_USE#discord-roles");
  });
});
