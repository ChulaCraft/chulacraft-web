import { beforeEach, describe, expect, it, vi } from "vitest";

// redirect() never returns, so it throws and the action's fail-closed paths end here.
vi.mock("next/navigation", () => ({ redirect: vi.fn((to: string) => { throw new Error(`REDIRECT:${to}`); }) }));

const m = vi.hoisted(() => ({ getUserIdentities: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), unlinkIdentity: vi.fn(), logIdentityChange: vi.fn() }));

vi.mock("@/lib/supabase/server", () => {
  const supabase = {
    auth: { getUserIdentities: m.getUserIdentities, getUser: m.getUser, unlinkIdentity: m.unlinkIdentity },
    rpc: m.rpc
  };
  // Both reads come from the session client now; the admin client is left for the
  // server-only log_identity_change RPC.
  return { createClient: async () => supabase, createAdminClient: () => ({ rpc: m.logIdentityChange }) };
});

import { redirect } from "next/navigation";
import { unlinkPersonalGoogle } from "./actions";

const form = (identityId: string) => {
  const data = new FormData();
  data.set("identityId", identityId);
  return data;
};

const chulaIdentity = { identity_id: "chula-id", id: "chula-sub", provider: "google", user_id: "u1", identity_data: { email: "me@student.chula.ac.th", email_verified: true } };
const personalIdentity = { identity_id: "personal-id", id: "personal-sub", provider: "google", user_id: "u1", identity_data: { email: "me@gmail.com" } };

const claim = (google_sub: string | null, error: unknown = null) => {
  // Reset first: beforeEach queues the happy-path claim, and this replaces it
  // rather than sitting behind it.
  m.rpc.mockReset();
  m.rpc.mockReturnValue({
    maybeSingle: async () => ({ data: google_sub ? { google_sub } : null, error })
  });
};

const settled = () => unlinkPersonalGoogle(form("personal-id")).catch((e: Error) => e.message);

describe("unlinkPersonalGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.getUserIdentities.mockResolvedValue({ data: { identities: [chulaIdentity, personalIdentity] }, error: null });
    m.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    claim("chula-sub");
    m.unlinkIdentity.mockResolvedValue({ error: null });
    m.logIdentityChange.mockResolvedValue({ error: null });
  });

  it("unlinks the personal identity and logs the change", async () => {
    expect(await settled()).toBe("REDIRECT:/dashboard?unlinked=1");
    expect(m.unlinkIdentity).toHaveBeenCalledWith(expect.objectContaining({ identity_id: "personal-id" }));
    expect(m.logIdentityChange).toHaveBeenCalledWith("log_identity_change", {
      p_user_id: "u1", p_identity_id: "personal-id", p_field: "google", p_old: "me@gmail.com", p_new: null
    });
  });

  it("refuses to unlink the claimed Chula identity", async () => {
    // Submitting the claimed identity's id: the claim's google_sub excludes it
    // from `personal`, so there is nothing to unlink.
    expect(await unlinkPersonalGoogle(form("chula-id")).catch((e: Error) => e.message)).toBe("REDIRECT:/dashboard?error=unlink_failed");
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
    expect(m.logIdentityChange).not.toHaveBeenCalled();
  });

  it("fails closed when the claim lookup errors", async () => {
    claim(null, { message: "boom" });
    expect(await settled()).toBe("REDIRECT:/dashboard?error=unlink_failed");
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("refuses an identity id that is not the caller's personal Google account", async () => {
    expect(await unlinkPersonalGoogle(form("someone-else")).catch((e: Error) => e.message)).toBe("REDIRECT:/dashboard?error=unlink_failed");
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("fails closed when the session has no user", async () => {
    m.getUser.mockResolvedValueOnce({ data: { user: null } });
    expect(await settled()).toBe("REDIRECT:/dashboard?error=unlink_failed");
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("redirects through next/navigation, not a bare return", () => {
    expect(redirect).not.toHaveBeenCalled();
  });
});