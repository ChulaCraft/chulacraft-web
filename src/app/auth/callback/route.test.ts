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
    expect(response.headers.get("location")).toBe("https://example.test/register");
  });
});
