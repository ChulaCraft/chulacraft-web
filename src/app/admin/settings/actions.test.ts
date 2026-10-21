import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); }) }));

import { SETTING_DEFAULTS } from "@/lib/site-content";
import { saveSiteSettings } from "./actions";

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
