import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Same sign-in as visual-audit.spec.ts: a fake session cookie that the
// Supabase stub (helpers/supabase-stub.mjs) accepts. The stub answers
// current_app_role with the role set here and serves fixture insights_* data.
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

async function signInAs(page: Page, role: string, fail = "") {
  const res = await fetch(`http://127.0.0.1:3211/__visual/state?authenticated=true&role=${role}&fail=${fail}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  await page.context().addCookies([{
    name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/",
    httpOnly: false, secure: false, sameSite: "Lax",
  }]);
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}

const tabs = (page: Page) => page.locator('nav[aria-label="Insights tabs"] a');
// Scoped to main: Next's route announcer is also role="alert".
const alerts = (page: Page) => page.locator("main").getByRole("alert");
const caption = (page: Page, text: string) => page.locator("figcaption", { hasText: text });
const heading = (page: Page) => page.getByRole("heading", { level: 1, name: "Insights" });

test.afterAll(async () => {
  await fetch("http://127.0.0.1:3211/__visual/state?authenticated=false", { method: "POST" });
});

test("owner sees all five tabs", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights");
  await expect(heading(page)).toBeVisible();
  await expect(tabs(page)).toHaveText(["Overview", "Players", "Events", "Community", "Staff activity"]);
  await expect(tabs(page).first()).toHaveAttribute("aria-current", "page");
  await expect(alerts(page)).toHaveCount(0);
});

test("moderator sees only Community, even when asking for Players", async ({ page }) => {
  await signInAs(page, "moderator");
  await page.goto("/admin/insights?tab=players");
  await expect(heading(page)).toBeVisible();
  await expect(tabs(page)).toHaveText(["Community"]);
  await expect(caption(page, "Ownership by tier (now)")).toBeVisible();
  await expect(alerts(page)).toHaveCount(0);
});

test("event staff sees only Events", async ({ page }) => {
  await signInAs(page, "event_staff");
  await page.goto("/admin/insights");
  await expect(tabs(page)).toHaveText(["Events"]);
  await expect(caption(page, "Interest and attendance per event")).toBeVisible();
  await expect(alerts(page)).toHaveCount(0);
});

test("a player gets the 404 page", async ({ page }) => {
  await signInAs(page, "user");
  await page.goto("/admin/insights");
  await expect(page.getByText("This chunk never loaded")).toBeVisible();
  await expect(heading(page)).toHaveCount(0);
});

test("bad params fall back to the first tab and 30 days", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights?range=999d&tab=nope");
  await expect(page.locator('nav[aria-label="Range"] a[aria-current="page"]')).toHaveText("30 days");
  await expect(tabs(page).first()).toHaveAttribute("aria-current", "page");
  await expect(alerts(page)).toHaveCount(0);
});

test("one failed RPC shows that panel's alert while the rest render", async ({ page }) => {
  await signInAs(page, "owner", "insights_events");
  await page.goto("/admin/insights?tab=overview");
  await expect(alerts(page)).toHaveCount(1);
  await expect(alerts(page)).toContainText("event");
  await expect(caption(page, "Registration funnel")).toBeVisible();
});

test("all-time range with one snapshot says when history starts", async ({ page }) => {
  await signInAs(page, "owner", "short_history");
  await page.goto("/admin/insights?tab=players&range=all");
  await expect(page.getByText(/History starts on /).first()).toBeVisible();
});

test("all-time snapshot charts that start after the first signup say when history starts", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights?tab=players&range=all");
  await expect(page.getByText(/History starts on .*Earlier days have no snapshot/).first()).toBeVisible();
  await expect(caption(page, "Players over time")).toBeVisible();
});

test("CSV download starts with the UTF-8 BOM", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights?tab=events");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download CSV/ }).first().click(),
  ]);
  const bytes = readFileSync(await download.path());
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
});

test("print hides navigation and shows the print header", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights?tab=players&range=7d");
  await expect(heading(page)).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const navs = page.locator("nav");
  for (let i = 0; i < await navs.count(); i++) await expect(navs.nth(i)).toBeHidden();
  const header = page.locator("[data-print-header]");
  await expect(header).toBeVisible();
  await expect(header).toContainText("ChulaCraft Insights · Players · 7 days · printed");
});

test("keyboard moves the line chart tooltip", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/insights?tab=players");
  const plot = page.locator('svg[role="group"]').first();
  const live = plot.locator("xpath=..").locator('[aria-live="polite"]');
  // The server-rendered svg is focusable before React hydrates it, and a key
  // pressed before then is dropped, so retry focus + End until the page answers.
  await expect(async () => {
    await plot.focus();
    await page.keyboard.press("End");
    await expect(live).not.toHaveText("", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  const last = await live.textContent();
  await page.keyboard.press("ArrowLeft");
  await expect(live).not.toHaveText(last ?? "");
});

test("no horizontal scroll at 375 px on any tab", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInAs(page, "owner");
  for (const tab of ["overview", "players", "events", "community", "staff"]) {
    await page.goto(`/admin/insights?tab=${tab}`);
    await expect(heading(page)).toBeVisible();
    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth);
    expect(overflow, `tab ${tab} overflows`).toBeLessThanOrEqual(1);
  }
});

// The Players page strip: the same numbers as the Insights Players tab.
const strip = (page: Page) => page.locator('section[aria-label="Player insights"]');
const rowName = (page: Page) => page.getByText("Table Player One").first();

test("owner sees the four insight tiles on /admin/players", async ({ page }) => {
  await signInAs(page, "owner");
  await page.goto("/admin/players");
  const tiles = strip(page).locator("a");
  await expect(tiles).toHaveCount(4);
  for (const label of ["Players", "New signups 30d", "Chula verified", "Guests"]) {
    await expect(strip(page).getByText(label, { exact: true })).toBeVisible();
  }
  for (let i = 0; i < 4; i++) await expect(tiles.nth(i)).toHaveAttribute("href", "/admin/insights?tab=players");
  await expect(strip(page).locator("svg[role=img]")).toHaveCount(4);
  await expect(rowName(page)).toBeVisible();
});

test("moderator sees no insight tiles on /admin/players", async ({ page }) => {
  await signInAs(page, "moderator");
  await page.goto("/admin/players");
  await expect(rowName(page)).toBeVisible();
  await expect(strip(page)).toHaveCount(0);
});

test("a failed insights RPC hides the strip but the players table still renders", async ({ page }) => {
  await signInAs(page, "owner", "insights_players");
  await page.goto("/admin/players");
  await expect(rowName(page)).toBeVisible();
  await expect(strip(page)).toHaveCount(0);
  await expect(alerts(page)).toHaveCount(0);
});
