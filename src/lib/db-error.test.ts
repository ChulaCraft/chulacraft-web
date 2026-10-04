import { describe, expect, it } from "vitest";
import { dbErrorCode } from "./db-error";

describe("dbErrorCode", () => {
  it("returns a message that is exactly an uppercase code", () => {
    expect(dbErrorCode({ message: "NOT_FOUND" })).toBe("NOT_FOUND");
    expect(dbErrorCode({ message: "CU_SSO_REQUIRED" })).toBe("CU_SSO_REQUIRED");
    expect(dbErrorCode({ message: "  LIMIT_REACHED  " })).toBe("LIMIT_REACHED");
  });

  it("rejects anything that isn't only a code", () => {
    expect(dbErrorCode({ message: "connection reset" })).toBeNull();
    expect(dbErrorCode({ message: "NOT_FOUND: row missing" })).toBeNull();
    expect(dbErrorCode({ message: "raise exception NOT_FOUND" })).toBeNull();
    expect(dbErrorCode({ message: "" })).toBeNull();
    expect(dbErrorCode({ message: 42 })).toBeNull();
    expect(dbErrorCode({})).toBeNull();
    expect(dbErrorCode(null)).toBeNull();
  });
});