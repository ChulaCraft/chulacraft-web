import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient, UserIdentity } from "@supabase/supabase-js";
import { reconcileIdentities } from "./reconcile-identities";

function identity(provider: string, id: string, data: Record<string, unknown> = {}, created_at = "2026-01-01"): UserIdentity {
  return { id, identity_id: `row-${id}`, user_id: "u1", provider, identity_data: data, created_at };
}
const discord = identity("discord", "d1");
const cu = identity("google", "cu", { email: "s@student.chula.ac.th", email_verified: true });
const gmail = identity("google", "gm", { email: "me@gmail.com", email_verified: true }, "2026-02-01");

const m = {
  unlinkIdentity: vi.fn(),
  rpc: vi.fn(),
  logRows: [] as unknown[],
  claimSub: null as string | null,
};
const session = { auth: { unlinkIdentity: m.unlinkIdentity } } as unknown as SupabaseClient;
const query = {
  select: () => query, eq: () => query,
  limit: async () => ({ data: m.logRows, error: null }),
  maybeSingle: async () => ({ data: m.claimSub ? { google_sub: m.claimSub } : null, error: null }),
};
const admin = { rpc: m.rpc, from: () => query } as unknown as SupabaseClient;

const run = (identities: UserIdentity[]) => reconcileIdentities(session, admin, "u1", identities);
const unlinkedIds = () => m.unlinkIdentity.mock.calls.map(([i]) => (i as UserIdentity).id);
function claimFails(message: string) {
  m.rpc.mockImplementation(async (name: string) => (name === "claim_chula" ? { error: { message } } : { error: null }));
}

describe("reconcileIdentities", () => {
  beforeEach(() => {
    m.unlinkIdentity.mockReset().mockResolvedValue({ error: null });
    m.rpc.mockReset().mockResolvedValue({ error: null });
    m.logRows = [];
    m.claimSub = null;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("signs out an account without a Discord base", async () => {
    expect(await run([cu])).toEqual({ signOut: true, reason: "discord_required" });
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("signs out an account with two Discord identities", async () => {
    expect(await run([discord, identity("discord", "d2"), cu])).toEqual({ signOut: true, reason: "discord_required" });
  });

  it("sends a Discord-only user to /verify", async () => {
    expect(await run([discord])).toEqual({ signOut: false, path: "/verify" });
  });

  it("claims a verified Chula account and lands on /welcome", async () => {
    expect(await run([discord, cu])).toEqual({ signOut: false, path: "/welcome" });
    expect(m.rpc).toHaveBeenCalledWith("claim_chula", { p_user_id: "u1", p_google_sub: "cu", p_email: "s@student.chula.ac.th" });
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("unlinks a personal Google used on the verify step", async () => {
    expect(await run([discord, gmail])).toEqual({ signOut: false, path: "/verify?error=cu_wrong_domain" });
    expect(unlinkedIds()).toEqual(["gm"]);
  });

  it("unlinks an unverified Chula-domain identity", async () => {
    const bad = identity("google", "bad", { email: "x@chula.ac.th" });
    expect(await run([discord, bad])).toEqual({ signOut: false, path: "/verify?error=cu_wrong_domain" });
    expect(unlinkedIds()).toEqual(["bad"]);
  });

  it("unlinks a Chula account already claimed by someone else", async () => {
    claimFails("CU_ALREADY_LINKED");
    expect(await run([discord, cu])).toEqual({ signOut: false, path: "/verify?error=cu_already_linked" });
    expect(unlinkedIds()).toEqual(["cu"]);
  });

  it("unlinks a second Chula account (swap) but keeps the verified one", async () => {
    const other = identity("google", "cu2", { email: "t@chula.ac.th", email_verified: true }, "2026-05-01");
    m.rpc.mockImplementation(async (name: string, args: { p_google_sub?: string }) =>
      name === "claim_chula" && args.p_google_sub === "cu2" ? { error: { message: "CU_SWAP_FORBIDDEN" } } : { error: null });
    expect(await run([discord, cu, other])).toEqual({ signOut: false, path: "/dashboard?error=cu_swap" });
    expect(unlinkedIds()).toEqual(["cu2"]);
  });

  it("keeps every identity on a transient claim failure", async () => {
    claimFails("connection reset");
    expect(await run([discord, cu, gmail])).toEqual({ signOut: false, path: "/verify?error=other" });
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("keeps the claimed account as Chula even if its email left the domain", async () => {
    m.claimSub = "cu";
    const moved = identity("google", "cu", { email: "alumni@gmail.com", email_verified: true });
    expect(await run([discord, moved, gmail])).toEqual({ signOut: false, path: "/welcome" });
    expect(m.rpc).toHaveBeenCalledWith("claim_chula", expect.objectContaining({ p_google_sub: "cu" }));
    expect(m.unlinkIdentity).not.toHaveBeenCalled();
  });

  it("keeps one personal Google once verified and logs it the first time", async () => {
    expect(await run([discord, cu, gmail])).toEqual({ signOut: false, path: "/welcome" });
    expect(m.rpc).toHaveBeenCalledWith("log_identity_change", expect.objectContaining({ p_identity_id: "row-gm", p_new: "me@gmail.com" }));

    m.rpc.mockClear();
    m.logRows = [{ id: "logged" }];
    await run([discord, cu, gmail]);
    expect(m.rpc).not.toHaveBeenCalledWith("log_identity_change", expect.anything());
  });

  it("unlinks extra personal Google accounts, keeping the oldest", async () => {
    const newer = identity("google", "gm2", { email: "two@gmail.com" }, "2026-06-01");
    expect(await run([discord, cu, gmail, newer])).toEqual({ signOut: false, path: "/dashboard?error=personal_limit" });
    expect(unlinkedIds()).toEqual(["gm2"]);
  });
});
