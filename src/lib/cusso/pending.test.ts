import { beforeAll, describe, expect, it, vi } from "vitest";

import { openPendingLink, sealPendingLink } from "./pending";

const link = { userId: "u1", uid: "6530000021", username: "player", email: null, displayName: null };

describe("pending Chula link cookie", () => {
  beforeAll(() => { process.env.CHULA_SSO_APP_SECRET = "test-secret"; });

  it("round-trips a sealed link", () => {
    expect(openPendingLink(sealPendingLink(link))).toMatchObject(link);
  });

  it("rejects tampered, unsigned, and expired values", () => {
    const [, signature] = sealPendingLink(link).split(".");
    const forged = Buffer.from(JSON.stringify({ ...link, uid: "other", exp: Date.now() + 60_000 })).toString("base64url");
    expect(openPendingLink(`${forged}.${signature}`)).toBeNull();
    expect(openPendingLink(forged)).toBeNull();
    expect(openPendingLink(undefined)).toBeNull();

    const sealed = sealPendingLink(link);
    vi.useFakeTimers({ now: Date.now() + 301_000 });
    expect(openPendingLink(sealed)).toBeNull();
    vi.useRealTimers();
  });
});
