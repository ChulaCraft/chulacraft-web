import { describe, expect, it } from "vitest";
import { activeView, playersHref, readPlayers, rpcArgs, VIEWS } from "./params";

describe("players table params", () => {
  it("defaults to everyone, newest first", () => {
    expect(rpcArgs(readPlayers({}))).toEqual({ p_filters: {}, p_query: "", p_sort: "joined", p_desc: true });
  });

  it("passes column filters through as the RPC's jsonb", () => {
    expect(rpcArgs(readPlayers({ status: "guest,unverified", whitelist: "pending", minecraft: "Steve", sort: "player", dir: "asc", q: "kai" })))
      .toEqual({ p_filters: { minecraft: "Steve", whitelist: ["pending"], status: ["guest", "unverified"] }, p_query: "kai", p_sort: "player", p_desc: false });
  });

  it("builds the dashboard links", () => {
    expect(playersHref({ role: ["user"], status: ["verified"] })).toBe("/admin/players?role=user&status=verified");
    expect(playersHref({ whitelist: ["whitelisted", "pending", "retrying"] })).toBe("/admin/players?whitelist=whitelisted%2Cpending%2Cretrying");
  });

  it("knows which view a URL is showing", () => {
    expect(activeView(readPlayers({}))).toBe("Everyone");
    expect(activeView(readPlayers({ status: "guest", role: "user" }))).toBe("Guests");
    expect(activeView(readPlayers({ status: "guest" }))).toBeNull();
    expect(VIEWS.map((v) => v.label)).toEqual(["Everyone", "Players", "Verified Chula", "Guests", "Unverified", "Staff", "Banned"]);
  });
});
