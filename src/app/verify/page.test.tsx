import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, getUserIdentities, rpc, redirect, reconcileIdentities } = vi.hoisted(() => ({
  getUser: vi.fn(), getUserIdentities: vi.fn(), rpc: vi.fn(), redirect: vi.fn(), reconcileIdentities: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, getUserIdentities }, rpc }),
  createAdminClient: () => ({}),
}));
vi.mock("@/lib/reconcile-identities", () => ({ reconcileIdentities }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/sign-out-button", () => ({ SignOutButton: () => <button>Sign out</button> }));
vi.mock("@/components/google-auth", () => ({ LinkGoogleButton: () => <button>Verify with Chula Google</button> }));

import VerifyPage from "./page";

const page = (error?: string) => VerifyPage({ searchParams: Promise.resolve({ error }) });

describe("VerifyPage", () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    getUserIdentities.mockReset().mockResolvedValue({ data: { identities: [] }, error: null });
    rpc.mockReset().mockResolvedValue({ data: false, error: null });
    reconcileIdentities.mockReset().mockResolvedValue({ signOut: false, path: "/verify" });
    redirect.mockReset().mockImplementation((path: string) => { throw new Error(`REDIRECT ${path}`); });
  });

  it("offers only verify and sign out to an unverified user, with a known error", async () => {
    const markup = renderToStaticMarkup(await page("cu_wrong_domain"));
    expect(markup).toContain("Verify with Chula Google");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("@student.chula.ac.th Google account to verify");
  });

  it("shows the error from cleaning up console-linked identities", async () => {
    reconcileIdentities.mockResolvedValue({ signOut: false, path: "/verify?error=cu_already_linked" });
    expect(renderToStaticMarkup(await page())).toContain("already linked to another ChulaCraft account");
  });

  it("follows reconcile when it verifies the user or finds a broken account", async () => {
    reconcileIdentities.mockResolvedValue({ signOut: false, path: "/welcome" });
    await expect(page()).rejects.toThrow("REDIRECT /welcome");

    reconcileIdentities.mockResolvedValue({ signOut: true, reason: "discord_required" });
    await expect(page()).rejects.toThrow("REDIRECT /auth/error?reason=discord_required");
  });

  it("ignores unknown error codes", async () => {
    expect(renderToStaticMarkup(await page("<b>x</b>"))).not.toContain("<b>x</b>");
  });

  it("sends verified users on to /welcome and signed-out visitors home", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(page()).rejects.toThrow("REDIRECT /welcome");
    expect(reconcileIdentities).not.toHaveBeenCalled();

    getUser.mockResolvedValue({ data: { user: null } });
    await expect(page()).rejects.toThrow("REDIRECT /");
  });

  it("shows the unavailable state when verification can't be checked", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    expect(renderToStaticMarkup(await page())).toContain("temporarily unavailable");
  });
});
