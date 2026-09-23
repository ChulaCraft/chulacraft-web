import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidMinecraftUsername, normalizeMinecraftUsername, registrationError, statusMessage } from "./registration";
import { BoundedFetchTimeoutError, createBoundedFetch } from "./bounded-fetch";

afterEach(() => vi.unstubAllGlobals());

describe("Minecraft username validation", () => {
  it("trims valid names and rejects unsafe values", () => {
    expect(normalizeMinecraftUsername("  Example_Player ")).toBe("Example_Player");
    expect(isValidMinecraftUsername("Example_Player")).toBe(true);
    expect(isValidMinecraftUsername("no")).toBe(false);
    expect(isValidMinecraftUsername("player name")).toBe(false);
    expect(isValidMinecraftUsername("player;op")).toBe(false);
  });
});

describe("bounded server fetch", () => {
  it("converts its own timeout into a safe error", async () => {
    vi.stubGlobal("fetch", (_input: unknown, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true })));
    await expect(createBoundedFetch(1)("https://example.test")).rejects.toBeInstanceOf(BoundedFetchTimeoutError);
  });

  it("preserves a caller cancellation instead of recategorizing it as a timeout", async () => {
    vi.stubGlobal("fetch", (_input: unknown, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true })));
    const controller = new AbortController();
    const request = createBoundedFetch(10_000)("https://example.test", { signal: controller.signal });
    const reason = new Error("CALLER_CANCELLED");
    controller.abort(reason);
    await expect(request).rejects.toBe(reason);
  });
});

describe("status copy", () => {
  it("never calls a pending registration complete", () => {
    expect(statusMessage({ desiredWhitelisted: true, syncStatus: "pending" })).toContain("Waiting");
    expect(statusMessage({ desiredWhitelisted: true, syncStatus: "synced" })).toContain("whitelisted");
  });
});

describe("registration RPC errors", () => {
  it("maps database error codes to safe responses", () => {
    expect(registrationError("REGISTRATION_CONFLICT").status).toBe(409);
    expect(registrationError("duplicate key", "23505").status).toBe(409);
    expect(registrationError("LIMIT_REACHED").error).toContain("5");
    expect(registrationError("CU_SSO_REQUIRED").status).toBe(403);
    expect(registrationError("REGISTRATION_BLOCKED").status).toBe(403);
    expect(registrationError("connection reset").status).toBe(503);
  });
});
