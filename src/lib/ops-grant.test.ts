import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSION } from "./mcsv-token";

// Manual checklist, Phase 7 "audit log has `ops` rows with the jti": the row itself is
// written by admin_ops_access (supabase/tests/ops_console.test.sql checks its shape).
// This pins the website half: the jti it sends is the one inside the token.
const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc, auth: { getUser: m.getUser } }) }));

import { opsGrant } from "./ops";

const claims = (token: string) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("opsGrant", () => {
  beforeEach(() => {
    m.rpc.mockReset();
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1", user_metadata: { user_name: "kai" }, identities: [] } } });
    process.env.MCSV_JWT_PRIVATE_KEY = generateKeyPairSync("ed25519").privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n");
  });

  it("logs the action with a fresh jti and signs that same jti into the token", async () => {
    m.rpc.mockResolvedValue({ data: "owner", error: null });
    const token = await opsGrant("restart", PERMISSION.RESTART, "survival");
    expect(m.rpc).toHaveBeenCalledWith("admin_ops_access", { p_jti: expect.stringMatching(UUID_V4), p_service: "survival", p_action: "restart" });
    const { p_jti } = m.rpc.mock.calls[0][1];
    expect(claims(token!)).toMatchObject({ jti: p_jti, sub: "kai", permission: PERMISSION.RESTART, aud: "mcsv-manager" });
  });

  it("uses a different jti for every grant", async () => {
    m.rpc.mockResolvedValue({ data: "owner", error: null });
    await opsGrant("stop", PERMISSION.STOP, "survival");
    await opsGrant("stop", PERMISSION.STOP, "survival");
    expect(m.rpc.mock.calls[0][1].p_jti).not.toBe(m.rpc.mock.calls[1][1].p_jti);
  });

  it("gives no token when the role lacks a bit, but the action was still sent to the log", async () => {
    m.rpc.mockResolvedValue({ data: "admin", error: null });
    expect(await opsGrant("stop", PERMISSION.STOP, "survival")).toBeNull();
    expect(m.rpc).toHaveBeenCalledTimes(1);
  });

  it("gives no token when the database refuses or nobody is signed in", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "FORBIDDEN" } });
    expect(await opsGrant("update", PERMISSION.UPDATE, "discord-bot")).toBeNull();
    m.rpc.mockClear();
    m.getUser.mockResolvedValue({ data: { user: null } });
    expect(await opsGrant("status", PERMISSION.STATUS, "survival")).toBeNull();
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
