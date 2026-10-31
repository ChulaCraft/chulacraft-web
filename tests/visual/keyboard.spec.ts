import { expect, test, type Locator, type Page } from "@playwright/test";
import { resetVisualSession, VISUAL_PLAYER_ID, visualSession } from "./helpers/visual-auth";

// Keyboard-only walkthrough (Phase 7, step 6; docs/a11y-keyboard-pass.md): sign
// in, verify, details, add a Minecraft name, and report a player, with Tab /
// Shift+Tab / Enter / Space / arrows only, no mouse. Every stop on the way must
// show a visible focus ring. Real Discord and Google OAuth cannot run here, so
// those steps stop at the request that would leave for the provider; the
// Mojang lookup behind "Add account" is answered in the browser.
const WIDTHS = ["mobile-375x812", "desktop-1440x900"];

test.beforeEach(() => {
  test.skip(!WIDTHS.includes(test.info().project.name), "the 375 px and desktop projects cover the widths");
});
test.afterAll(async () => {
  await resetVisualSession();
});

async function flow(name: "unverified" | "new") {
  const res = await fetch(`http://127.0.0.1:3211/__visual/state?authenticated=true&role=user&flow=${name}`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not set visual flow: ${res.status}`);
}

/** Presses Tab until `target` has focus (at most 80 times), checking that each
 *  focused element shows a focus indicator. Fails if the target is never reached. */
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring = (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none";
      return { ring, label: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}"` };
    });
    if (focus) expect(focus.ring, `no visible focus ring on ${focus.label}`).toBe(true);
    if (await target.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Tab never reached ${target}`);
}

test("sign in: Continue with Discord is reachable and starts Discord OAuth", async ({ page }) => {
  await visualSession(page, null);
  const authorize = page.waitForRequest((req) => req.url().includes("/auth/v1/authorize"));
  await page.route("**/auth/v1/authorize**", (route) => route.fulfill({ contentType: "text/html", body: "<title>Discord</title>" }));
  await page.goto("/register");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await tabTo(page, page.getByRole("button", { name: /Continue with Discord/ }));
  await page.keyboard.press("Enter");
  expect(new URL((await authorize).url()).searchParams.get("provider")).toBe("discord");
});

test("verify: Verify with Chula Google is reachable and starts the Google link", async ({ page }) => {
  await visualSession(page, "user");
  await flow("unverified");
  const link = page.waitForRequest((req) => req.url().includes("/auth/v1/user/identities/authorize"));
  await page.route("**/auth/v1/user/identities/authorize**", (route) => route.fulfill({ json: { url: "http://127.0.0.1:3211/health" } }));
  await page.goto("/verify");
  await expect(page.getByRole("heading", { level: 1, name: /Verify you.re Chula/ })).toBeVisible();
  await tabTo(page, page.getByRole("button", { name: "Verify with Chula Google" }));
  await page.keyboard.press("Enter");
  expect(new URL((await link).url()).searchParams.get("provider")).toBe("google");
});

test("details, then add a Minecraft name, by keyboard only", async ({ page }) => {
  await visualSession(page, "user");
  await flow("new");
  await page.goto("/register/details");
  await expect(page.getByRole("heading", { level: 1, name: "Tell us about you" })).toBeVisible();

  await tabTo(page, page.getByLabel("First name"));
  await page.keyboard.type("Visual");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Player");
  await page.keyboard.press("Tab"); // nickname (optional)
  await page.keyboard.press("Tab"); // study level: first radio
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Faculty")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByLabel("Faculty")).not.toHaveValue("");
  const major = page.getByLabel("Major");
  await expect(major).toBeEnabled();
  if ((await major.inputValue()) === "") {
    await page.keyboard.press("Tab");
    await expect(major).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(major).not.toHaveValue("");
  }
  await tabTo(page, page.getByRole("button", { name: /Finish registration/ }));
  await page.keyboard.press("Enter");
  await page.waitForURL("**/welcome");

  await tabTo(page, page.getByRole("link", { name: /Add your Java username/ }));
  await page.keyboard.press("Enter");
  await page.waitForURL("**/settings#add-account");

  // The Mojang lookup and the write happen server-side; answer them here.
  let added = false;
  await page.route("**/api/registration/minecraft", (route) => {
    if (route.request().method() === "POST") {
      added = true;
      return route.fulfill({ json: {} });
    }
    return route.fulfill({ json: { registrations: added ? [{
      id: "00000000-0000-4000-8000-0000000000d1", minecraftUsername: "Visual_KB", desiredWhitelisted: true, syncStatus: "pending",
      updatedAt: new Date().toISOString(),
    }] : [] } });
  });
  await tabTo(page, page.getByLabel("Minecraft Java username"));
  await page.keyboard.type("Visual_KB");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Added Visual_KB" })).toBeVisible();
});

test("report a player by keyboard only; Escape closes the dialog and focus returns", async ({ page }) => {
  await visualSession(page, "user");
  await page.goto(`/player/${VISUAL_PLAYER_ID}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const report = page.getByRole("button", { name: "Report" });

  await tabTo(page, report);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: /Report Steve Builder/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(report).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  // Focus starts inside the dialog: the checked reason. Arrow keys pick another.
  await expect(dialog.getByRole("radio", { name: /Griefing/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("radio", { name: /Cheating/ })).toBeChecked();
  await tabTo(page, dialog.getByRole("textbox", { name: "Details" }));
  await page.keyboard.type("Used x-ray near spawn on Saturday night.");
  await tabTo(page, dialog.getByRole("button", { name: "Send report" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Report sent" })).toBeVisible();
});
