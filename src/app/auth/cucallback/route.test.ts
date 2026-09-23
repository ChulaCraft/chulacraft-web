import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  resolveTicket: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  getUserById: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/cusso/server", () => ({ resolveTicket: m.resolveTicket }));
vi.mock("@/lib/env", () => ({
  getSiteUrl: () => "https://site.test",
  getPublicSupabaseEnvironment: () => ({ url: "https://db.test", key: "pub" }),
  getChulaSSOAppSecret: () => "secret",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: m.getUser } }),
  createAdminClient: () => ({
    rpc: m.rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: m.maybeSingle }) }) }),
    auth: { admin: { getUserById: m.getUserById, generateLink: m.generateLink } },
  }),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { verifyOtp: m.verifyOtp } }) }));

import { GET } from "./route";

const profile = { uid: "6500000021", username: "somchai", firstname: "Somchai", lastname: "J", email: "s@student.chula.ac.th", disable: false };

// Default: a flow this browser started (it holds the cu_state cookie).
async function location(query: string, cookie: string | null = "cu_state=login") {
  const url = `https://site.test/auth/cucallback?${query}`;
  const response = await GET(new NextRequest(url, cookie ? { headers: { cookie } } : undefined));
  return response.headers.get("location");
}

describe("Chula SSO callback", () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => fn.mockReset());
    m.resolveTicket.mockResolvedValue({ profile });
    m.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("rejects tickets this browser didn't request", async () => {
    expect(await location("ticket=t", null)).toBe("https://site.test/auth/error?reason=start_failed");
    expect(await location("ticket=t", "cu_state=bogus")).toBe("https://site.test/auth/error?reason=start_failed");
    expect(m.resolveTicket).not.toHaveBeenCalled();
  });

  it("rejects missing, invalid, and disabled tickets", async () => {
    expect(await location("")).toBe("https://site.test/auth/error?reason=start_failed");
    m.resolveTicket.mockResolvedValueOnce({ error: { status: 401 } });
    expect(await location("ticket=t")).toBe("https://site.test/auth/error?reason=cu_ticket_invalid");
    m.resolveTicket.mockResolvedValueOnce({ profile: { ...profile, disable: true } });
    expect(await location("ticket=t")).toBe("https://site.test/auth/error?reason=cu_disabled");
  });

  it("only stages a link, for a link flow started by this browser", async () => {
    m.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    expect(await location("ticket=t")).toBe("https://site.test/welcome");

    const response = await GET(new NextRequest("https://site.test/auth/cucallback?ticket=t", { headers: { cookie: "cu_state=link" } }));
    expect(response.headers.get("location")).toBe("https://site.test/auth/cusso/confirm");
    expect(response.cookies.get("cu_pending")?.value).toBeTruthy();
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("refuses signed-out sign-in for an unlinked Chula account", async () => {
    m.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await location("ticket=t")).toBe("https://site.test/auth/error?reason=cu_not_linked");
    expect(m.generateLink).not.toHaveBeenCalled();
  });

  it("signs a linked user in with a real Supabase session", async () => {
    m.maybeSingle.mockResolvedValue({ data: { user_id: "u1" }, error: null });
    m.getUserById.mockResolvedValue({ data: { user: { id: "u1", email: "p@test" } }, error: null });
    m.generateLink.mockResolvedValue({ data: { properties: { hashed_token: "hash" } }, error: null });
    m.verifyOtp.mockResolvedValue({ error: null });

    expect(await location("ticket=t")).toBe("https://site.test/welcome");
    expect(m.generateLink).toHaveBeenCalledWith({ type: "magiclink", email: "p@test" });
    expect(m.verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "hash" });
  });
});
