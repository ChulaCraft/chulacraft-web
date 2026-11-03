import type { Page } from "@playwright/test";
import { stubUrl } from "./ports.mjs";

// The visual user's Supabase session cookie (the stub accepts any signature) and
// the stub's role switch, shared by the a11y and seo specs.
const visualUserId = "00000000-0000-4000-8000-000000000001";
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = [
  encode({ alg: "HS256", typ: "JWT" }),
  encode({ sub: visualUserId, aud: "authenticated", role: "authenticated", exp: 4_102_444_800 }),
  "visual-signature",
].join(".");
const authCookieValue = `base64-${encode({
  access_token: accessToken,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 4_102_444_800,
  refresh_token: "visual-refresh-token",
  user: {
    id: visualUserId,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "discord", providers: ["discord"] },
    user_metadata: { full_name: "Visual Player", user_name: "visual-player" },
    created_at: "2026-01-01T00:00:00.000Z",
  },
})}`;

/** role null = logged out. Also stubs Vercel Analytics, which only Vercel serves. */
export async function visualSession(page: Page, role: string | null) {
  const res = await fetch(`${stubUrl}/__visual/state?authenticated=${role !== null}&role=${role ?? ""}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  if (role !== null) {
    await page.context().addCookies([{
      name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/",
      httpOnly: false, secure: false, sameSite: "Lax",
    }]);
  }
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}

export const resetVisualSession = () => fetch(`${stubUrl}/__visual/state?authenticated=false`, { method: "POST" });

/** Fixtures in helpers/supabase-stub.mjs. */
export const VISUAL_EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
export const VISUAL_PLAYER_ID = "00000000-0000-4000-8000-0000000000c1";
export const VISUAL_HIDDEN_PLAYER_ID = "00000000-0000-4000-8000-0000000000c2";
