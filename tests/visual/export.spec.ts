import { expect, test } from "@playwright/test";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";

// CSV export on every admin list (AC 15-18). Fixtures: helpers/stubs/export.mjs.
const PLAYER_ID = "00000000-0000-4000-8000-0000000000b1";
const LISTS = [
  { path: "/admin/reports", route: "/admin/reports/export" },
  { path: "/admin/appeals", route: "/admin/appeals/export" },
  { path: "/admin/audit", route: "/admin/audit/export" },
  { path: "/admin/commu/achievements", route: "/admin/commu/achievements/export" },
  { path: "/admin/commu/events", route: "/admin/commu/events/export" },
  { path: "/admin/players", route: "/admin/players/export" },
  { path: "/admin/players?role=moderator,event_staff,admin,owner", route: "/admin/players/export" },
];

test.afterEach(async () => { await resetVisualSession(); });

test.describe("admin CSV export", () => {
  for (const { path, route } of LISTS) {
    test(`${path} has Export all and a disabled Export ticked`, async ({ page }) => {
      await visualSession(page, "admin");
      await page.goto(path);
      const link = page.getByRole("link", { name: "Export all" });
      await expect(link).toBeVisible();
      expect(await link.getAttribute("href")).toContain(route);
      await expect(page.getByRole("button", { name: /Export ticked/ })).toBeDisabled();
    });
  }

  for (const path of ["/admin/reports", "/admin/appeals", "/admin/audit", "/admin/commu/events", "/admin/players"]) {
    test(`${path}: ticking a row enables Export ticked and downloads that row`, async ({ page }) => {
      await visualSession(page, "admin");
      await page.goto(path);
      await page.locator('input[name="id"][form="export-rows"]').first().check();
      const button = page.getByRole("button", { name: /Export ticked \(1\)/ });
      await expect(button).toBeEnabled();
      const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
      expect(download.suggestedFilename()).toMatch(/^chulacraft-.*\.csv$/);
      const { createReadStream } = await import("node:fs");
      const chunks: Buffer[] = [];
      for await (const chunk of createReadStream((await download.path())!)) chunks.push(chunk as Buffer);
      const bytes = Buffer.concat(chunks);
      expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
      expect(bytes.toString("utf8").trim().split("\r\n")).toHaveLength(2);
    });
  }

  test("GET returns the whole list as CSV for an admin and 403 for a moderator", async ({ page }) => {
    await visualSession(page, "admin");
    const ok = await page.request.get("/admin/reports/export");
    expect(ok.status()).toBe(200);
    const body = await ok.body();
    expect([...body.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    // Formula cell is neutralised, Thai survives.
    const text = body.toString("utf8");
    expect(text).toContain("'=Griefed the spawn");
    expect(text).toContain("สตีฟ");

    await visualSession(page, "moderator");
    expect((await page.request.get("/admin/reports/export")).status()).toBe(403);
    expect((await page.request.get("/admin/audit/export")).status()).toBe(403);
  });

  test("POST without a matching Origin is refused", async ({ page }) => {
    await visualSession(page, "admin");
    const res = await page.request.post("/admin/reports/export", { form: { id: PLAYER_ID }, headers: { origin: "https://evil.example" } });
    expect(res.status()).toBe(403);
  });
});
