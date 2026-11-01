import { expect, test } from "@playwright/test";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";

// v1.1 manual checklist, "Phase 6: insights" (docs/manual-check-v1.1-phases-5-7.md).
//   P6.1 keyboard left/right on a line chart ... tests/visual/insights.spec.ts "keyboard moves the line chart
//        tooltip" (End + ArrowLeft) and "ArrowRight" below
//   P6.2 chart data tables for a screen reader .. "every chart has its data table" below, and
//        src/components/charts/charts.test.tsx (ChartFrame). Actually listening with Orca or VoiceOver stays manual.
//   P6.3 Ctrl+P one-column light PDF ............ "print" below and insights.spec.ts "print hides navigation".
//        Looking at the printed PDF stays manual.
//   P6.4 numbers against real data .............. manual (needs real data)
//   P6.5 Decide: "Discord linked" step .......... manual decision, shipped as is (known risk)
const TABS = ["overview", "players", "events", "community", "staff"];

test.afterAll(resetVisualSession);

test("every chart has its data table in the page, readable by a screen reader", async ({ page }) => {
  await visualSession(page, "owner");
  for (const tab of TABS) {
    await page.goto(`/admin/insights?tab=${tab}`);
    await expect(page.getByRole("heading", { level: 1, name: "Insights" })).toBeVisible();
    const figures = page.locator("main figure");
    const n = await figures.count();
    for (let i = 0; i < n; i++) {
      const figure = figures.nth(i);
      const title = (await figure.locator("figcaption").first().textContent())?.trim();
      const table = figure.locator("table");
      // An empty chart says so instead of drawing a table.
      if (await table.count() === 0) { await expect(figure, `${tab}: ${title}`).toContainText(/no data|nothing|empty|yet/i); continue; }
      await expect(table.locator("thead th").first(), `${tab}: ${title} has headers`).toBeAttached();
      expect(await table.locator("tbody tr").count(), `${tab}: ${title} has rows`).toBeGreaterThan(0);
      // Clipped, not display:none or visibility:hidden, which screen readers skip.
      const hidden = await table.evaluate((el) => { const s = getComputedStyle(el); return s.display === "none" || s.visibility === "hidden"; });
      expect(hidden, `${tab}: ${title} must stay in the accessibility tree`).toBe(false);
    }
  }
});

test("keyboard: Home then ArrowRight moves the line chart tooltip forward", async ({ page }) => {
  await visualSession(page, "owner");
  await page.goto("/admin/insights?tab=players");
  const plot = page.locator('svg[role="group"]').first();
  const live = plot.locator("xpath=..").locator('[aria-live="polite"]');
  await expect(async () => {
    await plot.focus();
    await page.keyboard.press("Home");
    await expect(live).not.toHaveText("", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  const first = await live.textContent();
  await page.keyboard.press("ArrowRight");
  await expect(live).not.toHaveText(first ?? "");
});

test("print: light, one column, with the print header", async ({ page }) => {
  await visualSession(page, "owner");
  await page.goto("/admin/insights?tab=players&range=7d");
  await expect(page.getByRole("heading", { level: 1, name: "Insights" })).toBeVisible();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const [r, g, b] = background.match(/\d+/g)!.map(Number);
  expect((r + g + b) / 3, `body background ${background}`).toBeGreaterThan(200);
  const lefts = await page.locator("main figure").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
  expect(lefts.length).toBeGreaterThan(1);
  expect(new Set(lefts).size, `figure lefts ${lefts}`).toBe(1);
  await expect(page.locator("[data-print-header]")).toBeVisible();
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
});
