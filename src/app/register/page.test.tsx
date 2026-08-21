import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/site-header", () => ({
  SiteHeader: () => <header>Site header</header>,
}));
vi.mock("@/components/site-footer", () => ({
  SiteFooter: () => <footer>Site footer</footer>,
}));
vi.mock("@/components/discord-auth", () => ({
  DiscordAuthButton: () => <button>Sign Up with Discord</button>,
}));
vi.mock("@/components/cusso-auth", () => ({
  CussoAuthButton: () => <button>Sign Up with CU SSO</button>,
}));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    getUser.mockReset();
    redirect.mockReset();
  });

  it("redirects authenticated users to the welcome page", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    getUser.mockResolvedValue({ data: { user: { id: "user-id" } } });
    redirect.mockImplementation(() => {
      throw redirectError;
    });

    await expect(RegisterPage()).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledWith("/welcome");
  });

  it("renders the unavailable state when the auth lookup fails", async () => {
    getUser.mockRejectedValue(new Error("auth unavailable"));

    const markup = renderToStaticMarkup(await RegisterPage());

    expect(markup).toContain("Registration is temporarily unavailable");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders the framed registration choices for unauthenticated visitors", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const markup = renderToStaticMarkup(await RegisterPage());

    expect(markup).toContain("CHULACRAFT ACCESS");
    expect(markup).toContain("Continue to registration");
    expect(markup).toContain("Sign Up with Discord");
    expect(markup).toContain("Sign Up with CU SSO");
    expect(markup).toContain("Site header");
    expect(markup).toContain("Site footer");
    expect(redirect).not.toHaveBeenCalled();
  });
});
