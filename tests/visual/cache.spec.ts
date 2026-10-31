import { expect, test, type Page } from "@playwright/test";

// A content save is visible on the very next public load (the Phase 4 bug: revalidateTag
// served the old copy once after every save). Runs against the Supabase stub, which keeps
// site settings and pages in memory, so this exercises the Next caching layer only.
const visualUserId = "00000000-0000-4000-8000-000000000001";
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = [
  encode({ alg: "HS256", typ: "JWT" }),
  encode({ sub: visualUserId, aud: "authenticated", role: "authenticated", exp: 4_102_444_800 }),
  "visual-signature",
].join(".");
const authCookieValue = `base64-${encode({
  access_token: accessToken, token_type: "bearer", expires_in: 3600, expires_at: 4_102_444_800,
  refresh_token: "visual-refresh-token",
  user: {
    id: visualUserId, aud: "authenticated", role: "authenticated",
    app_metadata: { provider: "discord", providers: ["discord"] },
    user_metadata: { full_name: "Visual Player", user_name: "visual-player" },
    created_at: "2026-01-01T00:00:00.000Z",
  },
})}`;

async function signInAsOwner(page: Page) {
  const res = await fetch("http://127.0.0.1:3211/__visual/state?authenticated=true&role=owner", { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  await page.context().addCookies([{
    name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/",
    httpOnly: false, secure: false, sameSite: "Lax",
  }]);
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}

test.afterAll(async () => {
  await fetch("http://127.0.0.1:3211/__visual/state?authenticated=false", { method: "POST" });
});

test("a settings save shows on the very next homepage load", async ({ page }) => {
  await signInAsOwner(page);
  const stamp = `Stale guard ${Date.now()} at`;
  await page.goto("/");
  await page.goto("/admin/settings");
  const kicker = page.getByLabel(/Headline before/);
  const original = await kicker.inputValue();
  try {
    await kicker.fill(stamp);
    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/Settings saved/)).toBeVisible();
    // No retries, no reload loop: the first load after the save must already be fresh.
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(stamp, { timeout: 2000 });
  } finally {
    await page.goto("/admin/settings");
    await kicker.fill(original);
    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/Settings saved/)).toBeVisible();
    await page.goto("/");
    await expect(page.locator("h1")).not.toContainText(stamp, { timeout: 2000 });
  }
});

test("a page edit shows on the very next /rules load", async ({ page }) => {
  await signInAsOwner(page);
  const stamp = `Stale guard rule ${Date.now()}`;
  await page.goto("/rules");
  await page.goto("/admin/pages/rules");
  const body = page.locator("#p-body");
  const original = await body.inputValue();
  try {
    await body.fill(`${original}\n\n${stamp}\n`);
    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/Saved\./)).toBeVisible();
    await page.goto("/rules");
    await expect(page.locator("main")).toContainText(stamp, { timeout: 2000 });
  } finally {
    await page.goto("/admin/pages/rules");
    await body.fill(original);
    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/Back to the built-in text|Saved\./)).toBeVisible();
    await page.goto("/rules");
    await expect(page.locator("main")).not.toContainText(stamp, { timeout: 2000 });
  }
});
