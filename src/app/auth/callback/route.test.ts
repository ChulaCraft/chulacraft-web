import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession, getUserIdentities, signOut, reconcileIdentities } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUserIdentities: vi.fn(),
  signOut: vi.fn(),
  reconcileIdentities: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession, getUserIdentities, signOut } })
}));

vi.mock("@/lib/env", () => ({
  getPublicSupabaseEnvironment: () => ({ url: "https://example.supabase.co", key: "test-key" }),
  getSiteUrl: () => "https://example.test"
}));

vi.mock("@/lib/bounded-fetch", () => ({
  createBoundedFetch: () => vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/reconcile-identities", () => ({ reconcileIdentities }));

import { GET } from "./route";

const ok = { data: { user: { id: "u1" } }, error: null };

describe("OAuth callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    getUserIdentities.mockReset().mockResolvedValue({ data: { identities: [] }, error: null });
    signOut.mockReset().mockResolvedValue({ error: null });
    reconcileIdentities.mockReset().mockResolvedValue({ signOut: false, path: "/welcome" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("fails closed while still running the session exchange when code is missing", async () => {
    exchangeCodeForSession.mockResolvedValue(ok);

    const response = await GET(new NextRequest("https://example.test/auth/callback"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("");
    expect(reconcileIdentities).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://example.test/auth/error?reason=callback_missing_code"
    );
  });

  it("only redirects after a successful code exchange and rejects external next targets", async () => {
    exchangeCodeForSession.mockResolvedValue(ok);

    const response = await GET(
      new NextRequest("https://example.test/auth/callback?code=valid-code&next=//evil.example")
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(reconcileIdentities).toHaveBeenCalledWith(expect.anything(), expect.anything(), "u1", []);
    expect(response.headers.get("location")).toBe("https://example.test/welcome");
  });

  it("sends the user where reconcile decides, never where the request asks", async () => {
    exchangeCodeForSession.mockResolvedValue(ok);
    reconcileIdentities.mockResolvedValue({ signOut: false, path: "/verify?error=cu_wrong_domain" });

    const response = await GET(new NextRequest("https://example.test/auth/callback?code=x&next=/about"));

    expect(response.headers.get("location")).toBe("https://example.test/verify?error=cu_wrong_domain");
  });

  it("signs out an account without Discord", async () => {
    exchangeCodeForSession.mockResolvedValue(ok);
    reconcileIdentities.mockResolvedValue({ signOut: true, reason: "discord_required" });

    const response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));

    expect(signOut).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=discord_required");
  });

  it("fails when identities can't be read", async () => {
    exchangeCodeForSession.mockResolvedValue(ok);
    getUserIdentities.mockResolvedValue({ data: null, error: { message: "down" } });

    const response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));

    expect(reconcileIdentities).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=session_exchange_failed");
  });

  it("maps exchange failures to a fixed reason", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { code: "bad", status: 400 } });
    let response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=session_exchange_failed");

    exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { status: 400 } });
    response = await GET(new NextRequest("https://example.test/auth/callback?error=access_denied"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=cancelled");

    exchangeCodeForSession.mockRejectedValueOnce(new Error("down"));
    response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=session_exchange_failed");

    exchangeCodeForSession.mockRejectedValueOnce(new Error("down"));
    response = await GET(new NextRequest("https://example.test/auth/callback?error=server_error"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=provider_error");
  });

  it("explains a Google sign-in the signup hook refused", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { status: 400 } });
    const response = await GET(new NextRequest(
      "https://example.test/auth/callback?error=server_error&error_code=unexpected_failure&error_description=REGISTER_DISCORD_FIRST"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=register_discord_first");
  });
});
