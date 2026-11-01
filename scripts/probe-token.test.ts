import { execFileSync, spawnSync } from "node:child_process";
import { generateKeyPairSync, verify } from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = fileURLToPath(new URL("./probe-token.mjs", import.meta.url));
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const env = { PATH: process.env.PATH, MCSV_JWT_PRIVATE_KEY: pem };

const run = (args: string[], e: Record<string, string | undefined> = env) =>
  spawnSync(process.execPath, [script, ...args], { env: e, encoding: "utf8" });

describe("probe-token", () => {
  it("prints a 60 s token with only the named permission, signed by the key", () => {
    const token = execFileSync(process.execPath, [script, "status"], { env, encoding: "utf8" }).trim();
    const [h, p, s] = token.split(".");
    const claims = JSON.parse(Buffer.from(p, "base64url").toString());
    expect(claims).toMatchObject({ iss: "chulacraft-web", aud: "mcsv-manager", permission: 1 });
    expect(claims.exp - claims.iat).toBe(60);
    expect(verify(null, Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });

  it("takes any permission name, case-insensitively", () => {
    const token = run(["Backup_Read"]).stdout.trim();
    expect(JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).permission).toBe(128);
  });

  it("rejects an unknown permission name", () => {
    const r = run(["root"]);
    expect(r.status).toBe(2);
    expect(r.stdout).toBe("");
  });

  it("fails without a key and never prints a key", () => {
    const missing = run(["status"], { PATH: process.env.PATH });
    expect(missing.status).toBe(2);
    const bad = run(["status"], { PATH: process.env.PATH, MCSV_JWT_PRIVATE_KEY: "not-a-key-SECRET" });
    expect(bad.status).toBe(1);
    expect(bad.stdout + bad.stderr).not.toContain("SECRET");
  });
});
