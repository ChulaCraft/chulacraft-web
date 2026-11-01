import { expect, test, type Page } from "@playwright/test";
import { managerUrl, stubUrl } from "./helpers/ports.mjs";

// /admin/ops against two stand-ins: the Supabase stub (helpers/supabase-stub.mjs,
// role switch + admin_ops_access) and the manager mock (scripts/local-mocks.mjs
// --manager-only, the ops contract with survival / discord-bot / whitelist-worker
// / fail). The mock's state is shared by every test, so a test that stops a
// service starts it again.
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
const MANAGER = managerUrl;

async function signInAs(page: Page, role: string, fail = "") {
  const res = await fetch(`${stubUrl}/__visual/state?authenticated=true&role=${role}&fail=${fail}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  await page.context().addCookies([{
    name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/",
    httpOnly: false, secure: false, sameSite: "Lax",
  }]);
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}

/** ok | down (503 on /services) | slow (/services answers after the 5 s timeout). */
async function managerMode(mode: "ok" | "down" | "slow") {
  const res = await fetch(`${MANAGER}/__mock/state?services=${mode}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set manager mock state: ${res.status}`);
}

const heading = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });
const rows = (page: Page) => page.locator("li[data-service]");
const row = (page: Page, id: string) => page.locator(`li[data-service="${id}"]`);
// Scoped to main: Next's route announcer is also role="alert".
const alerts = (page: Page) => page.locator("main").getByRole("alert");

test.afterEach(async () => {
  await managerMode("ok");
});
test.afterAll(async () => {
  await fetch(`${stubUrl}/__visual/state?authenticated=false`, { method: "POST" });
});

test("owner sees every manager service plus the website; only the broken one shows an error", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops");
  await expect(heading(page, "Ops")).toBeVisible();
  await expect(rows(page)).toHaveCount(6);
  await expect(row(page, "fail")).toContainText("Couldn't load status");
  for (const id of ["survival", "discord-bot", "whitelist-worker", "website"]) {
    await expect(row(page, id)).not.toContainText("Couldn't load status");
    await expect(row(page, id).locator("[data-status-chip]")).toHaveText(/Up|Down|Restarting|Unknown/);
  }
  await expect(row(page, "survival").getByRole("img", { name: /Uptime, last 7 days/ })).toBeVisible();
  await expect(row(page, "website")).toContainText("Website");
});

test("status chips always carry text and an icon", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops");
  await expect(rows(page)).toHaveCount(6);
  const chips = page.locator("[data-status-chip]");
  expect(await chips.count()).toBeGreaterThanOrEqual(5);
  for (let i = 0; i < await chips.count(); i++) {
    await expect(chips.nth(i)).toHaveText(/\S/);
    await expect(chips.nth(i).locator("svg")).toHaveCount(1);
  }
});

test("backups list shows the failed entry in words and offers a backup per target", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops");
  const backups = page.locator('section[aria-label="Backups"]');
  await expect(backups.getByRole("cell", { name: /Failed/ })).toBeVisible();
  await expect(backups.getByRole("button", { name: /Back up now/ })).toHaveCount(2);
});

test("/admin/server redirects to /admin/ops", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/server");
  await expect(page).toHaveURL(/\/admin\/ops$/);
  await expect(heading(page, "Ops")).toBeVisible();
});

test("discord-bot detail offers Pull & restart to the owner", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/discord-bot");
  await expect(heading(page, "Discord bot")).toBeVisible();
  await expect(page.getByText("ghcr.io/chulacraft/discord-bot:latest@1a2b3c4d")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pull & restart/ })).toBeVisible();
});

test("admin sees the image tags but no Pull & restart", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin/ops/discord-bot");
  await expect(heading(page, "Discord bot")).toBeVisible();
  await expect(page.getByText("ghcr.io/chulacraft/discord-bot:latest@1a2b3c4d")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pull & restart/ })).toHaveCount(0);
  // Admin may restart but never start or stop.
  await expect(page.getByRole("button", { name: /Restart/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Stop$/ })).toHaveCount(0);
});

test("restart asks for confirmation, then shows the done alert", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/survival");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Restart Survival/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Restart sent" })).toBeVisible();
  await expect(page).toHaveURL(/done=restart/);
});

test("every action dialog works from the keyboard alone", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/survival");
  for (const name of ["Start", "Restart", "Stop"]) {
    const trigger = page.getByRole("button", { name, exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Focus starts on Cancel, so Enter right away is never destructive.
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  await page.goto("/admin/ops");
  const backup = page.locator('section[aria-label="Backups"]').getByRole("button", { name: /Back up now/ }).first();
  await backup.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Backup started" })).toBeVisible();
});

test("stopping survival shows Down in the list while the console stays connected", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/survival");
  const consolePanel = page.locator('section[aria-label="Console"]');
  await expect(consolePanel.getByRole("status")).toHaveText(/live/i);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Stop sent" })).toBeVisible();
  await expect(consolePanel.getByRole("status")).toHaveText(/live/i);
  await page.goto("/admin/ops");
  await expect(row(page, "survival").locator("[data-status-chip]")).toHaveText("Down");
  // Leave the shared mock as we found it.
  await page.goto("/admin/ops/survival");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Start sent" })).toBeVisible();
});

test("manager down: the website row and an error panel still render", async ({ page }) => {
  await managerMode("down");
  await signInAs(page, "owner");
  await page.goto("/admin/ops");
  await expect(heading(page, "Ops")).toBeVisible();
  await expect(row(page, "website")).toBeVisible();
  await expect(alerts(page).filter({ hasText: "Couldn't reach the server manager" })).toBeVisible();
});

test("manager slower than 5 s: the page still renders", async ({ page }) => {
  test.setTimeout(30_000);
  await managerMode("slow");
  await signInAs(page, "owner");
  await page.goto("/admin/ops");
  await expect(row(page, "website")).toBeVisible();
  await expect(alerts(page).filter({ hasText: "Couldn't reach the server manager" })).toBeVisible();
});

test("the broken service's detail page shows its errors, not a crash", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/fail");
  await expect(heading(page, "Broken service")).toBeVisible();
  await expect(page.locator("[data-status-chip]")).toHaveText("Couldn't load status");
  await expect(page.getByText("Couldn't load usage history.")).toBeVisible();
  await expect(page.getByText("Couldn't load the image tags.")).toBeVisible();
});

test("website page lists grouped errors; empty feed says so", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/website");
  await expect(heading(page, "Website")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Cannot read properties of undefined (reading 'name')" })).toBeVisible();
  await signInAs(page, "owner", "no_app_errors");
  await page.goto("/admin/ops/website");
  await expect(page.getByText("No errors in the last 24 hours")).toBeVisible();
});

test("a moderator gets the 404 page", async ({ page }) => {
  await signInAs(page, "moderator");
  for (const path of ["/admin/ops", "/admin/ops/survival", "/admin/ops/website"]) {
    await page.goto(path);
    await expect(page.getByText("This chunk never loaded")).toBeVisible();
  }
});

test("no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInAs(page, "owner");
  for (const path of ["/admin/ops", "/admin/ops/survival", "/admin/ops/discord-bot", "/admin/ops/fail", "/admin/ops/website"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth);
    expect(overflow, `${path} overflows`).toBeLessThanOrEqual(1);
  }
});
