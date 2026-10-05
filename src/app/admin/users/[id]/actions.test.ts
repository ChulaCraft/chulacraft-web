import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }));
// Next's redirect() signals control flow by throwing, so the mock must too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); })
}));

import { banUser, liftBan, markGuest, resetChula, setRole, setWhitelisted } from "./actions";

const USER_ID = "00000000-0000-0000-0000-0000000000a1";
const REGISTRATION_ID = "00000000-0000-0000-0000-0000000000b2";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const whitelisted = () => form({ userId: USER_ID, registrationId: REGISTRATION_ID, value: "true" });
const target = () => `NEXT_REDIRECT:/admin/users/${USER_ID}`;
const redirected = async (action: (data: FormData) => Promise<void>, data: FormData) =>
  action(data).then(() => null, (error: Error) => error.message);

describe("admin user actions", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.revalidatePath.mockReset();
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    for (const bad of ["r1", "0000-0000", "", "00000000-0000-0000-0000-00000000000z"]) {
      expect(await redirected(setRole, form({ userId: bad, role: "admin" }))).toBe("NEXT_REDIRECT:/admin");
      expect(await redirected(setWhitelisted, form({ userId: USER_ID, registrationId: bad, value: "true" }))).toBe("NEXT_REDIRECT:/admin");
      expect(await redirected(resetChula, form({ userId: bad }))).toBe("NEXT_REDIRECT:/admin");
      expect(await redirected(markGuest, form({ userId: bad }))).toBe("NEXT_REDIRECT:/admin");
    }
    expect(m.rpc).not.toHaveBeenCalled();
    expect(m.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a raised code as an error and a clean call as done", async () => {
    m.rpc.mockResolvedValueOnce({ error: { message: "FORBIDDEN" } });
    expect(await redirected(setRole, form({ userId: USER_ID, role: "admin" }))).toBe(`${target()}?error=FORBIDDEN`);
    expect(m.revalidatePath).toHaveBeenCalledWith(`/admin/users/${USER_ID}`);

    m.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(setRole, form({ userId: USER_ID, role: "admin" }))).toBe(`${target()}?done=role`);

    m.rpc.mockResolvedValueOnce({ error: { message: "connection reset" } });
    expect(await redirected(markGuest, form({ userId: USER_ID }))).toBe(`${target()}?error=FAILED`);
  });

  it("forwards each form to its own RPC", async () => {
    await redirected(setWhitelisted, whitelisted());
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_whitelisted", { p_registration_id: REGISTRATION_ID, p_value: true });
    await redirected(setWhitelisted, form({ userId: USER_ID, registrationId: REGISTRATION_ID, value: "false" }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_set_whitelisted", { p_registration_id: REGISTRATION_ID, p_value: false });
    await redirected(resetChula, form({ userId: USER_ID }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_reset_chula", { p_user_id: USER_ID });
    await redirected(markGuest, form({ userId: USER_ID }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_mark_guest", { p_user_id: USER_ID });
    await redirected(liftBan, form({ userId: USER_ID, banId: REGISTRATION_ID }));
    expect(m.rpc).toHaveBeenLastCalledWith("admin_lift_ban", { p_ban_id: REGISTRATION_ID });
  });

  it("turns the ban duration into an expiry, or none for permanent", async () => {
    const before = Date.now();
    expect(await redirected(banUser, form({ userId: USER_ID, reason: "grief", publicNote: "", duration: "7d" }))).toBe(`${target()}?done=banned`);
    const expires = Date.parse(m.rpc.mock.lastCall![1].p_expires_at);
    expect(expires - before).toBeGreaterThanOrEqual(7 * 86_400_000);
    expect(expires - Date.now()).toBeLessThanOrEqual(7 * 86_400_000);

    await redirected(banUser, form({ userId: USER_ID, reason: "grief", duration: "permanent" }));
    expect(m.rpc.mock.lastCall![1].p_expires_at).toBeUndefined();

    m.rpc.mockClear();
    expect(await redirected(banUser, form({ userId: USER_ID, reason: "grief", duration: "forever-ish" }))).toBe(`${target()}?error=INVALID`);
    expect(m.rpc).not.toHaveBeenCalled();
  });
});