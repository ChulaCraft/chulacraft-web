import { createHash, timingSafeEqual } from "node:crypto";
import { opsHealth } from "@/lib/ops-health";

const digest = (s: string) => createHash("sha256").update(s).digest();

/** Probed by the Discord bot's status monitor. Needs `Authorization: Bearer <OPS_HEALTH_TOKEN>`. */
export async function GET(request: Request) {
  const token = process.env.OPS_HEALTH_TOKEN;
  const given = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !given || !timingSafeEqual(digest(given), digest(token))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const health = await opsHealth();
  return Response.json(health, { status: health.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
