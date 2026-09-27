import { describe, expect, it } from "vitest";
import type { UserIdentity } from "@supabase/supabase-js";
import { classifyIdentities, isChulaEmail, linkErrorMessage } from "./chula";

function identity(provider: string, id: string, data: Record<string, unknown> = {}, created_at = "2026-01-01"): UserIdentity {
  return { id, identity_id: `row-${id}`, user_id: "u1", provider, identity_data: data, created_at };
}

describe("isChulaEmail", () => {
  it("accepts only the two Chula domains", () => {
    for (const ok of ["a@chula.ac.th", "6530000021@student.chula.ac.th", "A@CHULA.AC.TH"]) expect(isChulaEmail(ok)).toBe(true);
    for (const bad of ["a@gmail.com", "a@notchula.ac.th", "a@chula.ac.th.evil.com", "x@evil.com?@chula.ac.th", "a@sub.chula.ac.th",
      "@chula.ac.th", "a b@chula.ac.th", "", null, undefined, 42]) expect(isChulaEmail(bad)).toBe(false);
  });
});

describe("classifyIdentities", () => {
  it("splits discord, verified Chula, unverified Chula and personal Google, oldest first", () => {
    const result = classifyIdentities([
      identity("google", "p2", { email: "late@gmail.com" }, "2026-03-01"),
      identity("discord", "d1"),
      identity("google", "cu", { email: "s@student.chula.ac.th", email_verified: true }),
      identity("google", "bad", { email: "x@chula.ac.th", email_verified: false }),
      identity("google", "p1", { email: "me@gmail.com", email_verified: true }, "2026-02-01"),
    ]);
    expect(result.discord?.id).toBe("d1");
    expect(result.cu.map((i) => i.id)).toEqual(["cu"]);
    expect(result.invalid.map((i) => i.id)).toEqual(["bad"]);
    expect(result.personal.map((i) => i.id)).toEqual(["p1", "p2"]);
  });

  it("has no discord when only Google is linked", () => {
    expect(classifyIdentities([identity("google", "g", { email: "me@gmail.com" })]).discord).toBeNull();
  });
});

describe("linkErrorMessage", () => {
  it("only shows known codes", () => {
    expect(linkErrorMessage("cu_wrong_domain")).toContain("@chula.ac.th");
    expect(linkErrorMessage("toString")).toBeNull();
    expect(linkErrorMessage("<script>")).toBeNull();
    expect(linkErrorMessage(undefined)).toBeNull();
  });
});
