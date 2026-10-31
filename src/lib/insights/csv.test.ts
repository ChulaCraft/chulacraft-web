import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

const cols = [{ key: "name", label: "Name" }, { key: "n", label: "Count" }];

describe("toCsv", () => {
  it("starts with a BOM and uses CRLF", () => {
    const out = toCsv(cols, [{ name: "a", n: 1 }]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toBe("﻿Name,Count\r\na,1");
  });
  it("neutralises formulas and quotes", () => {
    expect(toCsv(cols, [{ name: '=HYPERLINK("x")', n: 1 }])).toContain(`"'=HYPERLINK(""x"")"`);
    for (const bad of ["+cmd", "-1+2", "-2+3", "=1+1", "+12%x", "-50%%", "+1.", "@SUM(A1)", "\tx", "\rx"]) expect(toCsv(cols, [{ name: bad, n: 1 }])).toContain(`'${bad}`);
  });
  it("keeps signed numbers and percentages as they are", () => {
    for (const ok of ["+12%", "-50%", "0%", "+3", "-3.5", "+0.25%"]) expect(toCsv(cols, [{ name: ok, n: 1 }])).toBe(`\uFEFFName,Count\r\n${ok},1`);
  });
  it("quotes commas and newlines, keeps negative numbers and nulls", () => {
    expect(toCsv(cols, [{ name: "a,b\nc", n: -5 }, { name: null, n: undefined }])).toBe('﻿Name,Count\r\n"a,b\nc",-5\r\n,');
  });
  it("round-trips Thai", () => {
    expect(toCsv(cols, [{ name: "กิจกรรม", n: 2 }])).toContain("กิจกรรม,2");
  });
});
