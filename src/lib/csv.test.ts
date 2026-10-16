import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "x\ny"]])).toBe('"a,b","say ""hi""","x\ny"\r\n');
  });
  it("neutralises spreadsheet formulas", () => {
    expect(toCsv([["=1+1", "+a", "-a", "@a", "ok"]])).toBe("'=1+1,'+a,'-a,'@a,ok\r\n");
  });
  it("writes null as empty and keeps numbers/booleans", () => {
    expect(toCsv([[null, 3, true]])).toBe(",3,true\r\n");
  });
});
