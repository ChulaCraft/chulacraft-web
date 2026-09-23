import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession } })
}));

vi.mock("@/lib/env", () => ({
  getPublicSupabaseEnvironment: () => ({ url: "https://example.supabase.co", key: "test-key" }),
  getSiteUrl: () => "https://example.test"
}));

vi.mock("@/lib/bounded-fetch", () => ({
  createBoundedFetch: () => vi.fn()
}));

import { GET } from "./route";

describe("OAuth callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("fails closed while still running the session exchange when code is missing", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(new NextRequest("https://example.test/auth/callback"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("");
    expect(response.headers.get("location")).toBe(
      "https://example.test/auth/error?reason=callback_missing_code"
    );
  });

  it("only redirects after a successful code exchange and rejects external next targets", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new NextRequest("https://example.test/auth/callback?code=valid-code&next=//evil.example")
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.headers.get("location")).toBe("https://example.test/welcome");
  });

  it("ignores internal next targets", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new NextRequest("https://example.test/auth/callback?code=valid-code&next=/about")
    );

    expect(response.headers.get("location")).toBe("https://example.test/welcome");
  });

  it("maps exchange failures to a fixed reason", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: { code: "bad", status: 400 } });
    let response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=session_exchange_failed");

    exchangeCodeForSession.mockResolvedValueOnce({ error: { status: 400 } });
    response = await GET(new NextRequest("https://example.test/auth/callback?error=access_denied"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=cancelled");

    exchangeCodeForSession.mockRejectedValueOnce(new Error("down"));
    response = await GET(new NextRequest("https://example.test/auth/callback?code=x"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=session_exchange_failed");

    exchangeCodeForSession.mockRejectedValueOnce(new Error("down"));
    response = await GET(new NextRequest("https://example.test/auth/callback?error=server_error"));
    expect(response.headers.get("location")).toBe("https://example.test/auth/error?reason=provider_error");
  });
});
