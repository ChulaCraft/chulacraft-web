import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { GALLERY_COVERED, GALLERY_EMPTY, GALLERY_PLAIN } from "./helpers/stubs/gallery.mjs";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";

// AC 29-31: category cards, the mosaic page, and the full-screen viewer, with
// the keyboard and with reduced motion. Fixtures come from helpers/stubs/gallery.mjs.
const WIDTHS = ["mobile-375x812", "desktop-1440x900"];

test.beforeEach(async ({ page }) => {
  test.skip(!WIDTHS.includes(test.info().project.name), "the 375 px and desktop projects cover the widths");
  await visualSession(page, null);
});
test.afterAll(async () => {
  await resetVisualSession();
});

const viewer = (page: Page) => page.getByRole("dialog", { name: "Picture viewer" });
const tiles = (page: Page) => page.getByRole("list", { name: /Pictures in/ }).getByRole("button");

test("/gallery lists a card per group with pictures, using the cover or the first picture", async ({ page }) => {
  await page.goto("/gallery");
  const cards = page.getByRole("main").getByRole("listitem");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Lobby building day");
  await expect(cards.nth(0)).toContainText("3 pictures");
  await expect(cards.nth(1)).toContainText("First Ender Dragon");
  await expect(page.getByText("Nothing here yet")).toHaveCount(0);
  // Next's optimizer URL carries the stored path: the cover wins, else the first picture.
  const src = (n: number) => cards.nth(n).locator("img").getAttribute("src");
  expect(decodeURIComponent((await src(0)) ?? "")).toContain("b0000000-0000-4000-8000-000000000006.png");
  expect(decodeURIComponent((await src(1)) ?? "")).toContain("b0000000-0000-4000-8000-000000000004.png");
  await cards.nth(1).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/gallery/${GALLERY_PLAIN}$`));
});

test("/gallery/<id> renders the mosaic with canonical and sitemap entries; unknown ids are 404", async ({ page, request, baseURL }) => {
  await page.goto(`/gallery/${GALLERY_COVERED}`);
  await expect(page.getByRole("heading", { level: 1, name: "Lobby building day" })).toBeVisible();
  await expect(tiles(page)).toHaveCount(3);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${baseURL}/gallery/${GALLERY_COVERED}`);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/gallery/${GALLERY_COVERED}`);
  expect(sitemap).toContain(`/gallery/${GALLERY_PLAIN}`);
  expect(sitemap).not.toContain(GALLERY_EMPTY);

  for (const id of ["a0000000-0000-4000-8000-0000000000ff", GALLERY_EMPTY, "not-a-uuid"]) {
    // The root loading boundary has already sent a 200 by the time notFound() throws, so read the page.
    await page.goto(`/gallery/${id}`);
    await expect(page.getByText("This chunk never loaded"), id).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first(), id).toHaveAttribute("content", /noindex/);
  }
});

test("viewer: click opens, arrows and buttons step, Esc closes and focus returns", async ({ page }) => {
  await page.goto(`/gallery/${GALLERY_COVERED}`);
  const second = tiles(page).nth(1);
  await second.click();
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page).getByText("2 / 3")).toBeVisible();
  await expect(viewer(page).getByText("A bridge to the spawn")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(viewer(page).getByText("3 / 3")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(viewer(page).getByText("1 / 3")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(viewer(page).getByText("3 / 3")).toBeVisible();
  await viewer(page).getByRole("button", { name: "Previous picture" }).click();
  await expect(viewer(page).getByText("2 / 3")).toBeVisible();
  await viewer(page).getByRole("button", { name: "Next picture" }).click();
  await expect(viewer(page).getByText("3 / 3")).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(viewer(page)).toHaveCount(0);
  await expect(tiles(page).nth(2)).toBeFocused();

  await tiles(page).nth(0).click();
  await viewer(page).getByRole("button", { name: "Close" }).click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(tiles(page).nth(0)).toBeFocused();
});

test("viewer: keyboard only, with a visible focus ring, and focus stays inside the dialog", async ({ page }) => {
  await page.goto(`/gallery/${GALLERY_COVERED}`);
  const first = tiles(page).nth(0);
  await first.focus();
  await expect(first).toBeFocused();
  expect(await first.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page).getByRole("button", { name: "Close" })).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => (document.activeElement === document.body || document.activeElement?.closest("dialog") != null)), `Tab ${i} reached the page behind the dialog`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(first).toBeFocused();
});

test.describe("motion", () => {
  test("reduced motion: the viewer runs no animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/gallery/${GALLERY_COVERED}`);
    await tiles(page).nth(0).click();
    await expect(viewer(page)).toBeVisible();
    const names = await viewer(page).evaluate((el) => [el, el.querySelector("img")].map((n) => getComputedStyle(n as Element).animationName));
    expect(names).toEqual(["none", "none"]);
  });

  test("without a preference, the viewer fades in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/gallery/${GALLERY_COVERED}`);
    await tiles(page).nth(0).click();
    await expect(viewer(page)).toBeVisible();
    expect(await viewer(page).evaluate((el) => getComputedStyle(el).animationName)).not.toBe("none");
  });
});
