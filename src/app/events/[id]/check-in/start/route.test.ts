import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));

vi.mock("@/lib/env", () => ({ getSiteUrl: () => "https://example.test" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc, auth: { getUser: m.getUser } }) }));

import { GET } from "./route";

const ID = "00000000-0000-0000-0000-0000000000e1";
const PAGE = `/events/${ID}/check-in`;
const call = (id = ID, t = "123.abc") => GET(new NextRequest(`https://example.test/events/${id}/check-in/start?t=${t}`), { params: Promise.resolve({ id }) });
const cookies = (response: Response) => response.headers.getSetCookie();

describe("check-in start", () => {
  beforeEach(() => {
    m.rpc.mockReset().mockResolvedValue({ data: "p.1.mac", error: null });
    m.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  it("never calls the database for an id that isn't a UUID", async () => {
    const response = await call("r1");
    expect(response.headers.get("location")).toBe("https://example.test/events");
    expect(m.rpc).not.toHaveBeenCalled();
  });

  it("sends an expired or forged token to the page with TOKEN_EXPIRED and sets nothing", async () => {
    m.rpc.mockResolvedValue({ data: null, error: null });
    const response = await call();
    expect(response.headers.get("location")).toBe(`https://example.test${PAGE}?error=TOKEN_EXPIRED`);
    expect(cookies(response)).toEqual([]);
  });

  it("stores the proof on the event's page and goes there when signed in", async () => {
    const response = await call();
    expect(m.rpc).toHaveBeenCalledWith("checkin_proof", { p_event_id: ID, p_token: "123.abc" });
    expect(response.headers.get("location")).toBe(`https://example.test${PAGE}`);
    const [proof, ...rest] = cookies(response);
    expect(proof).toMatch(/^cc_checkin=p\.1\.mac;/);
    expect(proof).toContain(`Path=${PAGE}`);
    expect(proof).toMatch(/Max-Age=300/);
    expect(proof).toMatch(/HttpOnly/);
    expect(proof).toMatch(/Secure/);
    expect(proof).toMatch(/SameSite=lax/i);
    expect(rest).toEqual([]);
  });

  it("also remembers the page and goes to /register when signed out", async () => {
    m.getUser.mockResolvedValue({ data: { user: null } });
    const response = await call();
    expect(response.headers.get("location")).toBe("https://example.test/register");
    const next = cookies(response).find((c) => c.startsWith("cc_next="));
    expect(next).toMatch(new RegExp(`^cc_next=${encodeURIComponent(PAGE).replace(/%2F/g, "(/|%2F)")};`));
    expect(next).toContain("Path=/;");
    expect(next).toMatch(/Max-Age=600/);
    expect(next).toMatch(/HttpOnly/);
    expect(next).toMatch(/Secure/);
  });
});
