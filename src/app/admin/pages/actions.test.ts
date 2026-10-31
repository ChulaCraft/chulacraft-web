import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); }) }));

import { DEFAULT_PAGES } from "@/lib/site-pages";
import { savePage } from "./actions";

const run = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return savePage(data).then(() => null, (e: Error) => e.message);
};

describe("savePage", () => {
  beforeEach(() => { m.rpc.mockReset().mockResolvedValue({ error: null }); });

  it("saves edited text", async () => {
    expect(await run({ slug: "rules", body: "## Be kind\r\n- please " })).toBe("NEXT_REDIRECT:/admin/pages/rules?done=saved");
    expect(m.rpc).toHaveBeenCalledWith("admin_save_site_page", { p_slug: "rules", p_body: "## Be kind\n- please" });
  });

  it("keeps the built-in text built-in when saved unchanged", async () => {
    await run({ slug: "terms", body: `${DEFAULT_PAGES.terms}\n` });
    expect(m.rpc).toHaveBeenCalledWith("admin_save_site_page", { p_slug: "terms", p_body: "" });
  });

  it("never calls the database for an unknown page", async () => {
    expect(await run({ slug: "about", body: "x" })).toBe("NEXT_REDIRECT:/admin/pages");
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
