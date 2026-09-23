import { test } from "@playwright/test";
import { auditPage } from "./helpers/audit-page";

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

const routes = [
  { name: "home", path: "/", expectedPath: "/", expectedStatus: 200, authenticated: false },
  { name: "about", path: "/about", expectedPath: "/about", expectedStatus: 200, authenticated: false },
  { name: "register-unauthenticated", path: "/register", expectedPath: "/register", expectedStatus: 200, authenticated: false },
  { name: "register", path: "/register", expectedPath: "/welcome", expectedStatus: 200, authenticated: true },
  { name: "dashboard", path: "/dashboard", expectedPath: "/dashboard", expectedStatus: 200, authenticated: true },
  { name: "auth-error", path: "/auth/error?reason=access_denied", expectedPath: "/auth/error", expectedStatus: 200, authenticated: false },
  { name: "not-found", path: "/visual-audit-not-found", expectedPath: "/visual-audit-not-found", expectedStatus: 404, authenticated: false },
] as const;

for (const route of routes) {
  test(`${route.name} renders safely and captures a stable full-page screenshot`, async ({ page }, testInfo) => {
    const stateResponse = await fetch(
      `http://127.0.0.1:3211/__visual/state?authenticated=${route.authenticated}`,
      { method: "POST" },
    );
    if (!stateResponse.ok) throw new Error(`Could not set visual auth state: ${stateResponse.status}`);
    if (route.authenticated) {
      await page.context().addCookies([{
        name: "sb-127-auth-token",
        value: authCookieValue,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      }]);
    }
    await auditPage(page, testInfo, {
      path: route.path,
      expectedPath: route.expectedPath,
      expectedStatus: route.expectedStatus,
      screenshotName: route.name,
    });
  });
}
