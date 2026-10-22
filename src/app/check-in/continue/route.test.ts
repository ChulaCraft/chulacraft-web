import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({ getSiteUrl: () => "https://example.test" }));

import { GET } from "./route";

const PATH = "/events/00000000-0000-0000-0000-0000000000e1/check-in";

function call(cookie?: string) {
  const request = new NextRequest("https://example.test/check-in/continue");
  if (cookie !== undefined) request.cookies.set("cc_next", cookie);
  return GET(request);
}

function cleared(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  return /^cc_next=;/.test(header) && /Max-Age=0/i.test(header) && /Path=\//.test(header);
}

describe("check-in continue", () => {
  it("goes to the stored check-in page and clears the cookie", async () => {
    const response = await call(PATH);
    expect(response.headers.get("location")).toBe(`https://example.test${PATH}`);
    expect(cleared(response)).toBe(true);
  });

  it("sends a bad value to /dashboard and still clears the cookie", async () => {
    for (const bad of ["//evil.example", "https://evil.example/", "/admin", `${PATH}?x=1`, "%2fevents"]) {
      const response = await call(bad);
      expect(response.headers.get("location")).toBe("https://example.test/dashboard");
      expect(cleared(response)).toBe(true);
    }
  });

  it("sends a missing cookie to /dashboard", async () => {
    const response = await call();
    expect(response.headers.get("location")).toBe("https://example.test/dashboard");
    expect(cleared(response)).toBe(true);
  });
});
