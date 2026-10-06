import { createPrivateKey, randomUUID, sign } from "node:crypto";

// Tokens for chulacraft-server-manager (docs/server-features-plan.md, Phase 6).
// Signed with Ed25519: the manager holds only the public key, so a
// compromised Minecraft host can check tokens but never mint one.

export const PERMISSION = {
  STATUS: 1,
  LOGS: 2,
  CONSOLE_READ: 4,
  CONSOLE_WRITE: 8,
  START: 16,
  STOP: 32,
  RESTART: 64
} as const;

/** Every bit, including ones the manager adds later: owners only. */
const ALL = 2147483647;
const P = PERMISSION;

/** What a site role may ever be granted; each token carries only the bits its request needs. */
export function maskFor(role: string | null | undefined) {
  if (role === "owner") return ALL;
  if (role === "admin") return P.STATUS | P.LOGS | P.CONSOLE_READ | P.RESTART;
  return 0;
}

const TTL_SECONDS = 60;
const b64url = (value: string) => Buffer.from(value).toString("base64url");

export function managerUrl() {
  return (process.env.MCSV_MANAGER_URL?.trim() || "https://mc.chulacraft.com/api/mcsv_manager").replace(/\/+$/, "");
}

/** ws:// or wss:// origin of the manager: the CSP connect-src entry the /admin/server console needs. */
export function managerSocketOrigin() {
  try {
    return new URL(managerUrl()).origin.replace(/^http/, "ws");
  } catch {
    return null;
  }
}

/** EdDSA JWT; `sub` is a display name for the manager's log, `jti` ties it to the audit row. */
export function mintToken(sub: string, permission: number, jti: string = randomUUID(), now = Date.now()) {
  const pem = process.env.MCSV_JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!pem) throw new Error("Missing required configuration: MCSV_JWT_PRIVATE_KEY.");
  const iat = Math.floor(now / 1000);
  const header = b64url(JSON.stringify({ alg: "EdDSA", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: "chulacraft-web", aud: "mcsv-manager", sub, jti, iat, exp: iat + TTL_SECONDS, permission
  }));
  const signature = sign(null, Buffer.from(`${header}.${payload}`), createPrivateKey(pem)).toString("base64url");
  return `${header}.${payload}.${signature}`;
}
