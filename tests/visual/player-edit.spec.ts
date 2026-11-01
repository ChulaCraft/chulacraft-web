import { expect, test, type Page } from "@playwright/test";
import { stubUrl } from "./helpers/ports.mjs";

// /admin/users/[id] stages every change in the browser and applies them together
// after a review. The stub (helpers/stubs/player-edit.mjs) keeps the player in memory.
const PLAYER = "00000000-0000-4000-8000-0000000000d1";
const visualUserId = "00000000-0000-4000-8000-000000000001";
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = [
  encode({ alg: "HS256", typ: "JWT" }),
  encode({ sub: visualUserId, aud: "authenticated", role: "authenticated", exp: 4_102_444_800 }),
  "visual-signature",
].join(".");
const authCookieValue = `base64-${encode({
  access_token: accessToken, token_type: "bearer", expires_in: 3600, expires_at: 4_102_444_800, refresh_token: "visual-refresh-token",
  user: { id: visualUserId, aud: "authenticated", role: "authenticated", app_metadata: { provider: "discord", providers: ["discord"] }, user_metadata: { full_name: "Visual Player", user_name: "visual-player" }, created_at: "2026-01-01T00:00:00.000Z" },
})}`;

async function signInAs(page: Page, role: string) {
  const res = await fetch(`${stubUrl}/__visual/state?authenticated=true&role=${role}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual auth state: ${res.status}`);
  await page.context().addCookies([{ name: "sb-127-auth-token", value: authCookieValue, domain: "127.0.0.1", path: "/", httpOnly: false, secure: false, sameSite: "Lax" }]);
  await page.route("**/_vercel/insights/**", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
}
const resetPlayer = (fail = false) => fetch(`${stubUrl}/__visual/player-edit?reset=1${fail ? "&fail=1" : ""}`, { method: "POST" });
const stubState = async () => (await fetch(`${stubUrl}/__visual/player-edit`)).json() as Promise<{ applies: number; player: { role: string; whitelisted: boolean } }>;
const main = (page: Page) => page.locator("main");

test.beforeEach(async ({ page }) => {
  await resetPlayer();
  await signInAs(page, "owner");
  await page.goto(`/admin/users/${PLAYER}`);
  await expect(page.getByRole("heading", { level: 1, name: "edit-target" })).toBeVisible();
});
test.afterAll(async () => {
  await fetch(`${stubUrl}/__visual/state?authenticated=false`, { method: "POST" });
});

test("loads with no enabled edit control and Edit reveals all eight for an owner", async ({ page }) => {
  // The admin sidebar search lives in the layout; only the player page itself must be inert.
  await expect(main(page).locator('section :is(input, select, textarea):not([disabled])')).toHaveCount(0);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  for (const control of [
    page.getByLabel("Mark as verified (guest)"), page.getByLabel("Reset Chula link"), page.getByLabel("Role", { exact: true }),
    page.getByLabel("Ban edit-target"), page.getByLabel("First name"), page.getByLabel("Profile", { exact: true }),
    page.getByLabel(/Give.*Gold Rush|Give/), page.getByLabel(/Remove.*EditSteve|Remove/),
  ]) await expect(control.first()).toBeEnabled();
});

test("staging sends nothing; review shows before and after; confirm applies and the page keeps it", async ({ page }) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First name").fill("Edited");
  await page.getByLabel("Remove EditSteve").check();
  expect((await stubState()).applies).toBe(0);

  await page.getByRole("button", { name: /Review changes \(2\)/ }).click();
  const dialog = page.getByRole("dialog", { name: /Review changes/ });
  await expect(dialog).toContainText("First name");
  await expect(dialog).toContainText("Edit");
  await expect(dialog).toContainText("Edited");
  await expect(dialog).toContainText("On the whitelist");
  await dialog.getByRole("button", { name: "Confirm and apply" }).click();

  await expect(page.getByText("Changes saved.")).toBeVisible();
  await expect(main(page).getByText("Edited Target")).toBeVisible();
  expect((await stubState()).applies).toBe(1);
  await page.reload();
  await expect(main(page).getByText("Edited Target")).toBeVisible();
});

test("leaving the page discards staged changes", async ({ page }) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First name").fill("Discarded");
  await page.goto("/admin/players");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "edit-target" })).toBeVisible();
  await expect(main(page).getByText("Edit Target")).toBeVisible();
  await expect(main(page).getByText("Discarded")).toHaveCount(0);
  await expect(page.getByLabel("First name")).toHaveCount(0);
  expect((await stubState()).applies).toBe(0);
});

test("a forced failure changes nothing and names the failed control", async ({ page }) => {
  await resetPlayer(true);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First name").fill("Nope");
  await page.getByLabel("Remove EditSteve").check();
  await page.getByRole("button", { name: /Review changes/ }).click();
  const dialog = page.getByRole("dialog", { name: /Review changes/ });
  await dialog.getByRole("button", { name: "Confirm and apply" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Minecraft account EditSteve");
  await expect(dialog.getByRole("alert")).toContainText("Nothing was saved");
  const { applies, player } = await stubState();
  expect(applies).toBe(0);
  expect(player.whitelisted).toBe(true);
});

test("ban, Chula reset and role rows show the extra warning", async ({ page }) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Reset Chula link").check();
  await page.getByLabel("Role", { exact: true }).selectOption("admin");
  await page.getByLabel("Ban edit-target").check();
  await page.getByLabel("Reason (admins only)").fill("grief");
  await page.getByRole("button", { name: /Review changes/ }).click();
  const dialog = page.getByRole("dialog", { name: /Review changes/ });
  await expect(dialog.getByRole("note")).toContainText("Banning removes every whitelisted account");
  await expect(dialog.getByRole("note")).toContainText("Resetting the Chula link");
  await expect(dialog.getByRole("note")).toContainText("role change");
});

test("making an owner needs the handle typed", async ({ page }) => {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Role", { exact: true }).selectOption("owner");
  await expect(page.getByRole("button", { name: /Review changes/ })).toBeDisabled();
  await page.getByLabel(/Type edit-target/).fill("edit-target");
  await expect(page.getByRole("button", { name: /Review changes/ })).toBeEnabled();
});
