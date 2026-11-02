import { expect, test, type Page } from "@playwright/test";
import { stubUrl } from "./helpers/ports.mjs";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";

// v1.1 manual checklist, "Phase 7: ops console" and "Bot settings" (docs/manual-check-v1.1-phases-5-7.md).
// Most of those boxes were already covered; this file closes the gaps. Item -> test:
//   Ops console
//     /admin/server redirects, nav says Ops ..... "nav" below + ops.spec.ts "/admin/server redirects"
//     stop survival, list shows Down ............ ops.spec.ts "stopping survival shows Down"
//     keyboard through every dialog ............. ops.spec.ts "every action dialog" (start, stop, restart, one
//                                                 backup) + "both backups" and "Pull & restart" below
//     `fail` row ................................ ops.spec.ts "owner sees every manager service"
//     /admin/ops/website ........................ ops.spec.ts "website page lists grouped errors";
//                                                 src/lib/ops-health.test.ts (health and version)
//     audit `ops` rows with the jti ............. src/lib/ops-grant.test.ts (website half) and
//                                                 supabase/tests/ops_console.test.sql (row shape). Stopping a
//                                                 real service on the real manager stays manual (G2 and G3).
//   Bot settings
//     change a channel, bot error ............... ops-bot.spec.ts "owner changes a channel", "a channel the bot can't find"
//     reset, restart-only note .................. ops-bot.spec.ts "a malformed value", "a restart-only setting"
//     pause/resume, Overdue ..................... ops-bot.spec.ts "tasks show their state", "when the bot stops reporting"
//     badge role vs bot role .................... "a role a badge may give" below (bot side), phase5-engagement.spec.ts
//                                                 "role allowlist" (settings side), supabase/tests/bot_admin.test.sql
//   Audits and SEO
//     sitemap, robots, manifest ................. seo.spec.ts "sitemap, robots.txt and the web manifest are served"
const asOwner = (page: Page) => visualSession(page, "owner");

test.afterAll(resetVisualSession);

test("nav says Ops, not Server", async ({ page }) => {
  await asOwner(page);
  await page.goto("/admin/server");
  await expect(page).toHaveURL(/\/admin\/ops$/);
  const nav = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Ops" }) }).first();
  await expect(nav.getByRole("link", { name: "Ops" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /^Server$/ })).toHaveCount(0);
});

test("both backup buttons (world and database) open a dialog that works from the keyboard", async ({ page }) => {
  await asOwner(page);
  await page.goto("/admin/ops");
  const buttons = page.locator('section[aria-label="Backups"]').getByRole("button", { name: /Back up now/ });
  await expect(buttons).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await page.goto("/admin/ops");
    await buttons.nth(i).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(buttons.nth(i)).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Backup started" })).toBeVisible();
  }
});

test("Pull & restart (owner) opens a dialog that starts on Cancel and closes with Escape", async ({ page }) => {
  await asOwner(page);
  await page.goto("/admin/ops/discord-bot");
  const pull = page.getByRole("button", { name: /Pull & restart/ });
  await pull.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a role a badge may give is refused as a bot role, with the reason", async ({ page }) => {
  await fetch(`${stubUrl}/__visual/bot?reset=1`, { method: "POST" });
  await asOwner(page);
  await page.goto("/admin/ops/bot");
  const field = page.locator('[data-setting="verified_role_id"]');
  await field.getByRole("textbox").fill("100000000000000011");
  await field.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main").getByRole("alert").filter({ hasText: "A badge may give that role" })).toBeVisible();
});
