import { describe, expect, it } from "vitest";
import { nextSort, paramsOf, readTable, tableHref, type Column } from "./table-query";

const COLUMNS: Column[] = [
  { key: "player", label: "Player", sort: true, filter: "text" },
  { key: "status", label: "Status", sort: true, filter: "enum", options: [{ value: "guest", label: "Guest" }, { value: "verified", label: "Verified" }] },
  { key: "joined", label: "Joined", sort: true, filter: "date" },
  { key: "note", label: "Note" },
];
const read = (sp: Record<string, string | string[] | undefined>) => readTable(sp, COLUMNS);

describe("readTable", () => {
  it("defaults to no filters, the default sort, descending", () => {
    expect(read({})).toEqual({ q: "", sort: "", desc: true, filters: {} });
  });

  it("reads each filter kind", () => {
    expect(read({ player: " kai ", status: "guest,verified", joined_from: "2026-10-01", joined_to: "2026-10-16", sort: "player", dir: "asc", q: " x " }))
      .toEqual({ q: "x", sort: "player", desc: false, filters: { player: "kai", status: ["guest", "verified"], joined_from: "2026-10-01", joined_to: "2026-10-16" } });
  });

  it("drops unknown columns, values, sorts and bad dates", () => {
    expect(read({ evil: "1", status: "guest,admin,guest", note: "x", joined_from: "2026-02-30", joined_to: "yesterday", sort: "note", dir: "up" }))
      .toEqual({ q: "", sort: "", desc: true, filters: { status: ["guest"] } });
  });

  it("takes the first of a repeated param and ignores inherited names", () => {
    expect(read({ player: ["a", "b"], sort: "constructor" })).toEqual({ q: "", sort: "", desc: true, filters: { player: "a" } });
  });

  it("merges repeated enum params, as checkboxes send them", () => {
    expect(read({ status: ["guest", "verified"] }).filters).toEqual({ status: ["guest", "verified"] });
  });

  it("caps text at 100 characters", () => {
    expect((read({ player: "x".repeat(150) }).filters.player as string).length).toBe(100);
  });
});

describe("tableHref", () => {
  it("round-trips through readTable and omits defaults", () => {
    const state = read({ status: "guest", sort: "player", dir: "asc" });
    const href = tableHref("/admin/players", state, { filters: { ...state.filters, player: "kai" } });
    expect(href).toBe("/admin/players?status=guest&player=kai&sort=player&dir=asc");
    expect(read(Object.fromEntries(new URL(href, "http://x").searchParams))).toEqual({ ...state, filters: { status: ["guest"], player: "kai" } });
  });

  it("cycles a column's sort: off → ascending → descending → off", () => {
    const off = read({});
    const asc = read(Object.fromEntries(new URL(tableHref("/t", off, nextSort(off, "player")), "http://x").searchParams));
    expect([asc.sort, asc.desc]).toEqual(["player", false]);
    const desc = read(Object.fromEntries(new URL(tableHref("/t", asc, nextSort(asc, "player")), "http://x").searchParams));
    expect([desc.sort, desc.desc]).toEqual(["player", true]);
    expect(tableHref("/t", desc, nextSort(desc, "player"))).toBe("/t");
    expect(nextSort(desc, "joined")).toEqual({ sort: "joined", desc: false });
  });

  it("removes a filter set to undefined", () => {
    const state = read({ status: "guest" });
    expect(tableHref("/admin/players", state, { filters: { status: undefined } })).toBe("/admin/players");
  });
});

describe("paramsOf", () => {
  it("keeps repeated keys as arrays", () => {
    expect(paramsOf(new URLSearchParams("status=guest&status=verified&q=a"))).toEqual({ status: ["guest", "verified"], q: "a" });
  });
});
