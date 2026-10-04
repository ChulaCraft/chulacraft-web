import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { restoreAccount } from "./actions";

const REGISTRATION_ID = "00000000-0000-0000-0000-0000000000b2";

function form(registrationId: string) {
  const data = new FormData();
  data.set("registrationId", registrationId);
  return data;
}

const redirected = (data: FormData) => restoreAccount(data).then(() => null, (error: Error) => error.message);

describe("admin restore action", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    expect(await redirected(form("r1"))).toBe("NEXT_REDIRECT:/admin");
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a raised code as an error and a clean call as restored", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "NOT_FOUND" } });
    expect(await redirected(form(REGISTRATION_ID))).toBe("NEXT_REDIRECT:/admin/restore?error=NOT_FOUND");

    m.rpc.mockResolvedValueOnce({ error: { message: "down" } });
    expect(await redirected(form(REGISTRATION_ID))).toBe("NEXT_REDIRECT:/admin/restore?error=FAILED");

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(form(REGISTRATION_ID))).toBe("NEXT_REDIRECT:/admin/restore?restored=1");
    expect(m.revalidatePath).toHaveBeenCalledWith("/admin/restore");
  });

  it("asks the RPC to whitelist the registration it was given", async () => {
    await redirected(form(REGISTRATION_ID));
    expect(m.rpc).toHaveBeenCalledWith("admin_set_whitelisted", { p_registration_id: REGISTRATION_ID, p_value: true });
  });
});