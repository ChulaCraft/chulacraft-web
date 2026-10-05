import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PERMISSION, maskFor, mintToken } from "./mcsv-token";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");

describe("manager tokens", () => {
  beforeEach(() => {
    // As pasted into a one-line env var.
    process.env.MCSV_JWT_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n");
  });
  afterEach(() => {
    delete process.env.MCSV_JWT_PRIVATE_KEY;
  });

  it("signs an EdDSA token the public key verifies, expiring in 60 seconds", () => {
    const token = mintToken("Krisanapon", 71, "j1", 1_791_199_326_000);
    const [header, payload, signature] = token.split(".");
    expect(verify(null, Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "EdDSA", typ: "JWT" });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iss: "chulacraft-web", aud: "mcsv-manager", sub: "Krisanapon", jti: "j1",
      iat: 1_791_199_326, exp: 1_791_199_386, permission: 71
    });
  });

  it("refuses to sign without a key", () => {
    delete process.env.MCSV_JWT_PRIVATE_KEY;
    expect(() => mintToken("x", 1)).toThrow(/MCSV_JWT_PRIVATE_KEY/);
  });

  it("gives owners everything, admins no write/start/stop, players nothing", () => {
    expect(maskFor("owner")).toBe(2147483647);
    expect(maskFor("admin")).toBe(71);
    expect(maskFor("admin") & (PERMISSION.CONSOLE_WRITE | PERMISSION.START | PERMISSION.STOP)).toBe(0);
    expect(maskFor("player")).toBe(0);
    expect(maskFor(null)).toBe(0);
  });
});
