import { expect, test, type Page } from "@playwright/test";
import { resetVisualSession, VISUAL_EVENT_ID, VISUAL_HIDDEN_PLAYER_ID, VISUAL_PLAYER_ID, visualSession } from "./helpers/visual-auth";

// SEO bar (Phase 7): every public page has a unique title, a description, an
// absolute canonical and an og:image that loads, and the crawler files exist.
// Metadata does not depend on width, so this runs on the desktop project only.
const PUBLIC = [
  "/", "/about", "/announcements", "/events", `/events/${VISUAL_EVENT_ID}`, "/gallery", "/team", "/players",
  `/player/${VISUAL_PLAYER_ID}`, "/rules", "/privacy", "/terms", "/register", "/search",
];

test.beforeEach(() => {
  test.skip(test.info().project.name !== "desktop-1440x900", "metadata is the same at every width");
});
test.afterAll(async () => {
  await resetVisualSession();
});

/** generateMetadata streams its tags into <body> for browsers, so read the whole document. */
async function readMeta(page: Page, path: string) {
  await visualSession(page, path.startsWith("/player") ? "user" : null);
  await page.goto(path, { waitUntil: "load" });
  await expect(page.locator("main h1").first()).toBeVisible();
  const attr = (selector: string, name: string) => page.locator(selector).first().getAttribute(name, { timeout: 2_000 }).catch(() => null);
  return {
    title: await page.title(),
    description: await attr('meta[name="description"]', "content"),
    canonical: await attr('link[rel="canonical"]', "href"),
    ogImage: await attr('meta[property="og:image"]', "content"),
    robots: await attr('meta[name="robots"]', "content"),
  };
}

const titles = new Map<string, string>();

for (const path of PUBLIC) {
  test(`${path} has a title, description, absolute canonical and a working og:image`, async ({ page, request }) => {
    const meta = await readMeta(page, path);
    expect(meta.title.trim(), "title").not.toBe("");
    titles.set(path, meta.title);
    expect(meta.description?.trim(), "meta description").toBeTruthy();
    expect(meta.canonical, "canonical").toMatch(/^https?:\/\//);
    expect(new URL(meta.canonical!).pathname, "canonical path").toBe(path);
    expect(meta.ogImage, "og:image").toMatch(/^https?:\/\//);
    const image = await request.get(meta.ogImage!);
    expect(image.status(), `og:image ${meta.ogImage}`).toBe(200);
    expect(image.headers()["content-type"]).toMatch(/^image\//);
    expect(meta.robots ?? "", "public pages are indexable").not.toContain("noindex");
  });
}

test("every public page has a different title", () => {
  test.skip(titles.size !== PUBLIC.length, "needs every page test above to have passed");
  const seen = new Map<string, string>();
  for (const [path, title] of titles) {
    expect(seen.get(title), `${path} repeats the title "${title}"`).toBeUndefined();
    seen.set(title, path);
  }
});

test("a profile the viewer cannot see is noindex and shares the site image", async ({ page }) => {
  const meta = await readMeta(page, `/player/${VISUAL_HIDDEN_PLAYER_ID}`);
  expect(meta.robots ?? "").toContain("noindex");
  expect(new URL(meta.ogImage!).pathname).toBe("/opengraph-image");
  // The layout's Open Graph basics survive the override.
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "ChulaCraft");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
});

test("a visible profile gets its own generated image", async ({ page }) => {
  const meta = await readMeta(page, `/player/${VISUAL_PLAYER_ID}`);
  expect(new URL(meta.ogImage!).pathname).toBe(`/player/${VISUAL_PLAYER_ID}/opengraph-image`);
});

test("an event gets its own generated image", async ({ page }) => {
  const meta = await readMeta(page, `/events/${VISUAL_EVENT_ID}`);
  expect(new URL(meta.ogImage!).pathname).toBe(`/events/${VISUAL_EVENT_ID}/opengraph-image`);
});

test("sitemap, robots.txt and the web manifest are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`/events/${VISUAL_EVENT_ID}</loc>`);
  expect(xml, "players are not listed").not.toContain("/player/");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const txt = await robots.text();
  for (const path of ["/admin", "/settings", "/dashboard", "/api"]) expect(txt).toContain(`Disallow: ${path}`);
  expect(txt).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const app = await manifest.json() as { name: string; icons: { src: string; sizes: string }[] };
  expect(app.name).toBeTruthy();
  expect(app.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of app.icons) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  }
  const favicon = await request.get("/favicon.ico");
  expect(favicon.status()).toBe(200);
});
