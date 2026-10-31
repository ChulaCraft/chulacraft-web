import { expect, test, type Page } from "@playwright/test";

// /admin/ops/bot against the Supabase stub (helpers/supabase-stub.mjs). The stub
// plays the bot: a saved setting is checked a moment later ("OK", or "Unknown
// Channel" for a value ending 0000), interval jobs run every 5 s while the page
// reads them, and POST /__visual/bot?reporting=false stops them. Each test
// resets the stub's bot state first.
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
const STUB = "http://127.0.0.1:3211";

async function signInAs(page: Page, role: string) {
  const res = await fetch(`${STUB}/__visual/state?authenticated=true&role=${role}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  await page.context().addCookies([{
    name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/",
    httpOnly: false, secure: false, sameSite: "Lax",
  }]);
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}

async function bot(query: string) {
  const res = await fetch(`${STUB}/__visual/bot?${query}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set the stub bot: ${res.status}`);
}

const setting = (page: Page, key: string) => page.locator(`[data-setting="${key}"]`);
const job = (page: Page, name: string) => page.locator(`tr[data-job="${name}"]`);

test.beforeEach(async () => {
  await bot("reset=1");
});
test.afterAll(async () => {
  await bot("reset=1");
  await fetch(`${STUB}/__visual/state?authenticated=false`, { method: "POST" });
});

test("owner changes a channel; the bot's check shows up on its own", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  await expect(page.getByRole("heading", { level: 1, name: "Discord bot" })).toBeVisible();
  await expect(page.getByText("The bot applies changes within about a minute.")).toBeVisible();
  const field = setting(page, "discord_announcement_channel_id");
  await field.getByRole("textbox").fill("1234567890123456789");
  await field.getByRole("button", { name: "Save" }).click();
  await expect(field.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await expect(field.getByText("Waiting for the bot to check")).toBeVisible();
  // No reload: the page refreshes itself while a check is pending.
  await expect(field.locator("[data-check]")).toHaveText(/OK/, { timeout: 15_000 });
  await expect(field).toContainText("Changed by Visual Owner");
});

test("a channel the bot can't find shows the bot's error", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  const field = setting(page, "discord_announcement_channel_id");
  await field.getByRole("textbox").fill("1234567890123450000");
  await field.getByRole("button", { name: "Save" }).click();
  await expect(field.locator("[data-check]")).toHaveText(/Bot can't find this channel: Unknown Channel/, { timeout: 15_000 });
});

test("a malformed value gets an inline error and Reset to default goes back", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  const field = setting(page, "discord_announcement_channel_id");
  await field.getByRole("textbox").fill("123");
  await field.getByRole("button", { name: "Save" }).click();
  await expect(field.getByRole("alert")).toContainText("17 to 20 digit");
  await expect(field.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");

  const changed = setting(page, "status_monitor_interval_ms");
  await expect(changed.getByRole("textbox")).toHaveValue("120000");
  await changed.getByRole("button", { name: "Reset to default" }).click();
  await expect(changed.getByRole("status").filter({ hasText: "Back to the default" })).toBeVisible();
  await expect(changed.getByRole("textbox")).toHaveValue("");
  await expect(changed.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
});

test("a restart-only setting says so and links to the bot's ops page", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin/ops/bot");
  const guild = setting(page, "discord_guild_id");
  await expect(guild).toContainText("Applies after the bot restarts");
  await expect(guild.getByRole("link", { name: /restart/i })).toHaveAttribute("href", "/admin/ops/discord-bot");
});

test("tasks show their state in words; pausing one shows Paused", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  await expect(job(page, "status_monitor").locator("[data-status-chip]")).toHaveText("OK");
  await expect(job(page, "status_monitor")).toContainText("every 5 s");
  await expect(job(page, "verified_role_sync")).toContainText("On events");
  for (const chip of await page.locator("[data-status-chip]").all()) await expect(chip.locator("svg")).toHaveCount(1);

  await job(page, "status_monitor").getByRole("button", { name: "Pause" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Paused" })).toBeVisible();
  await expect(job(page, "status_monitor").locator("[data-status-chip]")).toHaveText("Paused");
  await expect(job(page, "status_monitor").getByRole("button", { name: "Resume" })).toBeVisible();

  // The last 20 runs fold out under each task.
  await page.getByText("Last runs: Web announcements").click();
  await expect(page.getByRole("table", { name: "Last runs of Web announcements" }).getByRole("row")).not.toHaveCount(0);
});

test("retired settings and tasks are listed, folded, at the bottom", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  const retired = page.locator("details[data-retired]");
  await expect(retired).not.toHaveAttribute("open", "");
  await retired.locator("summary").click();
  await expect(retired).toContainText("Old welcome channel");
  await expect(retired).toContainText("Old cleanup task");
});

test("when the bot stops reporting, its tasks go Overdue after 3 intervals", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440x900", "waits 16 s; once is enough");
  test.setTimeout(45_000);
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  await expect(job(page, "web_announcements").locator("[data-status-chip]")).toHaveText("OK");
  await bot("reporting=false");
  await page.waitForTimeout(16_500);
  await page.reload();
  await expect(job(page, "web_announcements").locator("[data-status-chip]")).toHaveText("Overdue");
  await page.goto("/admin/ops");
  const row = page.locator('li[data-service="bot"]');
  await expect(row.locator("[data-status-chip]")).toHaveText("Overdue");
  await expect(row.getByRole("link")).toHaveAttribute("href", "/admin/ops/bot");
});

test("the ops list has a Discord bot row from the worst task state", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin/ops");
  const row = page.locator('li[data-service="bot"]');
  await expect(row.getByRole("link", { name: /Discord bot/ })).toHaveAttribute("href", "/admin/ops/bot");
  await expect(row.locator("[data-status-chip]")).toHaveText("OK");
});

test("a moderator gets the 404 page", async ({ page }) => {
  await signInAs(page, "moderator");
  await page.goto("/admin/ops/bot");
  await expect(page.getByText("This chunk never loaded")).toBeVisible();
});

test("no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInAs(page, "owner");
  await page.goto("/admin/ops/bot");
  await expect(page.locator("h1")).toBeVisible();
  const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
