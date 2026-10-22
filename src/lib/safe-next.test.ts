import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

const ID = "00000000-0000-0000-0000-0000000000e1";
const PATH = `/events/${ID}/check-in`;

describe("safeNext", () => {
  it("accepts the event check-in path", () => {
    expect(safeNext(PATH)).toBe(PATH);
  });

  it("rejects missing values", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext("")).toBeNull();
  });

  it("rejects protocol-relative and absolute URLs", () => {
    for (const bad of [`//evil.example${PATH}`, "//evil.example", `https://evil.example${PATH}`, `http://localhost${PATH}`, `javascript:alert(1)//${PATH}`]) {
      expect(safeNext(bad)).toBeNull();
    }
  });

  it("rejects other paths", () => {
    for (const bad of ["/", "/dashboard", `/events/${ID}`, `/events/${ID}/check-in/start`, "/events/not-a-uuid/check-in", `/admin/commu/events/${ID}/check-in`]) {
      expect(safeNext(bad)).toBeNull();
    }
  });

  it("rejects encoded and padded tricks", () => {
    for (const bad of [
      `/events%2f${ID}/check-in`, `%2fevents/${ID}/check-in`, `/events/${ID}%2fcheck-in`,
      `/\\evil.example${PATH}`, `\\\\evil.example${PATH}`, `/events\\${ID}/check-in`,
      ` ${PATH}`, `${PATH} `, `${PATH}\n`, `\t${PATH}`,
      `${PATH}/`, `${PATH}?x=1`, `${PATH}#x`, `${PATH}/../../admin`, `/events/${ID}/../check-in`,
      `/events/${ID.toUpperCase()}/check-in/`, `/Events/${ID}/check-in`
    ]) {
      expect(safeNext(bad)).toBeNull();
    }
  });
});
