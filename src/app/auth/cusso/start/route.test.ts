import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cusso/client", () => ({ getChulaLoginURL: () => "https://sso.test/login" }));
vi.mock("@/lib/env", () => ({ getSiteUrl: () => "https://site.test" }));

import { GET } from "./route";

const start = (site?: string) =>
  GET(new NextRequest("https://site.test/auth/cusso/start?intent=link", site ? { headers: { "sec-fetch-site": site } } : undefined));

describe("Chula SSO start", () => {
  it("refuses flows started by another site", async () => {
    const response = await start("cross-site");
    expect(response.headers.get("location")).toBe("https://site.test/auth/error?reason=start_failed");
    expect(response.cookies.get("cu_state")).toBeUndefined();
  });

  it("starts flows from our own pages", async () => {
    const response = await start("same-origin");
    expect(response.headers.get("location")).toBe("https://sso.test/login");
    expect(response.cookies.get("cu_state")?.value).toBe("link");
  });
});
