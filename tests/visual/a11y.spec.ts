import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetVisualSession, VISUAL_EVENT_ID, VISUAL_PLAYER_ID, visualSession } from "./helpers/visual-auth";

// Audit bar (Phase 7): axe reports no serious or critical violation on any
// public or admin page, at 375 px and desktop, in both colour schemes. The site
// is dark-only, so "light" checks that a light-preferring visitor still gets a
// readable page. /players and player pages are signed-in only, so they run as a player.
const PUBLIC = [
  "/", "/about", "/announcements", "/events", `/events/${VISUAL_EVENT_ID}`, "/gallery", "/team", "/players",
  `/player/${VISUAL_PLAYER_ID}`, "/rules", "/privacy", "/terms", "/register", "/search",
];
const ADMIN = ["/admin", "/admin/players", "/admin/insights", "/admin/ops", "/admin/reports", "/admin/commu/events"];
const WIDTHS = ["mobile-375x812", "desktop-1440x900"];

test.afterAll(async () => {
  await resetVisualSession();
});

for (const colorScheme of ["dark", "light"] as const) {
  test.describe(`axe (${colorScheme})`, () => {
    test.use({ colorScheme });
    test.beforeEach(() => {
      test.skip(!WIDTHS.includes(test.info().project.name), "the 375 px and desktop projects cover the widths");
    });

    for (const path of [...PUBLIC, ...ADMIN]) {
      test(`${path} has no serious or critical violations`, async ({ page }) => {
        const role = path.startsWith("/admin") ? "owner" : path.startsWith("/player") ? "user" : null;
        await visualSession(page, role);
        await page.goto(path, { waitUntil: "load" });
        // The root loading.tsx streams the page in; audit the page, not the skeleton.
        await expect(page.locator("main h1").first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(new URL(page.url()).pathname, "audited a redirect target instead").toBe(path);
        const { violations } = await new AxeBuilder({ page }).analyze();
        const blocking = violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.impact} ${v.id}: ${v.help}\n  ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join("\n  ")}`);
        expect(blocking, blocking.join("\n")).toEqual([]);
      });
    }
  });
}
