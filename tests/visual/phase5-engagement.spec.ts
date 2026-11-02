import { expect, test, type Page } from "@playwright/test";
import { stubUrl } from "./helpers/ports.mjs";
import { resetVisualSession, VISUAL_EVENT_ID, VISUAL_PLAYER_ID, visualSession } from "./helpers/visual-auth";

// v1.1 manual checklist, "Phase 5: engagement" (docs/manual-check-v1.1-phases-5-7.md).
// Runs on the Supabase stub (helpers/stubs/00-phase5.mjs). Checklist item -> test:
//   P5.1 role allowlist ............ "role allowlist"
//   P5.2 tier and role selects ..... "achievement form"
//   P5.3 tier frames ............... "tier frames"
//   P5.4 showcase .................. "showcase"
//   P5.5 staff check-in page ....... "staff check-in"
//   P5.6 player scan states ........ "player scan"   (real sign-in round trip stays manual)
//   P5.7 staff scanner ............. "staff scanner" (a real phone camera stays manual)
//   P5.8 award attendees ........... "award badge to attendees"
//   P5.9 reminder offsets .......... "event reminders"
//   P5.10 .ics ..................... "calendar" here and src/lib/ics.test.ts (a real calendar app stays manual)
//   P5.11 bell ..................... "notification bell"
//   P5.12 bot side ................. not here: the bot repo's tests and tests/contract (T3.2); a real guild stays manual
const EVENT = VISUAL_EVENT_ID;
const CHECK_IN = `/events/${EVENT}/check-in`;
const ADMIN_CHECK_IN = `/admin/commu/events/${EVENT}/check-in`;

async function arrange(page: Page, role: string | null, query = "") {
  const res = await fetch(`${stubUrl}/__visual/phase5?on=1&${query}`, { method: "POST" });
  if (!res.ok) throw new Error(`phase5 stub: ${res.status}`);
  await visualSession(page, role);
}

test.afterAll(async () => {
  await fetch(`${stubUrl}/__visual/phase5?on=0`, { method: "POST" });
  await resetVisualSession();
});

test("role allowlist: add, rename and remove a Discord role", async ({ page }) => {
  await arrange(page, "owner");
  await page.goto("/admin/settings");
  const list = page.getByRole("list", { name: "Allowed Discord roles" });
  await expect(list).toContainText("Builder crew");
  await page.getByLabel("Role ID").fill("100000000000000022");
  await page.getByLabel("Label").fill("Event regulars");
  await page.getByRole("button", { name: "Save role" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Role saved" })).toBeVisible();
  await expect(list).toContainText("Event regulars");
  await page.getByRole("button", { name: "Remove Event regulars" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Role removed" })).toBeVisible();
  await expect(list).not.toContainText("Event regulars");
  await expect(list).toContainText("Builder crew");
});

test("role allowlist: a role a badge still gives can't be removed, and a bot role can't be added", async ({ page }) => {
  await arrange(page, "owner");
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: "Remove Builder crew" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "A badge still gives that role" })).toBeVisible();
  await page.getByLabel("Role ID").fill("100000000000009999");
  await page.getByLabel("Label").fill("Bot's own");
  await page.getByRole("button", { name: "Save role" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The Discord bot uses that role" })).toBeVisible();
});

test("achievement form: tier select and a role select that offers only allowlisted roles", async ({ page }) => {
  await arrange(page, "owner");
  await page.goto("/admin/commu/achievements/new");
  await expect(page.getByLabel("Tier").locator("option")).toHaveText(["Common", "Rare", "Epic", "Legendary"]);
  await expect(page.getByLabel(/Discord role/).locator("option")).toHaveText(["None", "Builder crew"]);
});

test("tier frames: each tier is written as text and framed differently, on /dashboard and /player", async ({ page }) => {
  await arrange(page, "user");
  for (const path of ["/dashboard", `/player/${VISUAL_PLAYER_ID}`]) {
    await page.goto(path);
    // Nothing is picked, so the showcase holds the top three tiers; only the full grid has Common.
    const grid = page.locator("main ul").filter({ has: page.getByText("Tier: Common") }).last();
    const cards = grid.locator("li");
    await expect(cards).toHaveCount(4);
    for (const tier of ["Common", "Rare", "Epic", "Legendary"]) await expect(grid.getByText(`Tier: ${tier}`)).toBeVisible();
    const frames = await cards.evaluateAll((els) => els.map((el) => {
      const style = getComputedStyle(el);
      return `${style.borderTopColor}|${style.boxShadow}|${style.outlineColor}`;
    }));
    expect(new Set(frames).size, `frames: ${frames.join(" / ")}`).toBe(4);
  }
});

test.describe("showcase", () => {
  test("pick up to three, save, and the row follows", async ({ page }) => {
    await arrange(page, "user");
    await page.goto("/dashboard");
    await expect(page.getByText("Showing your top badges")).toBeVisible();
    const picker = page.getByRole("group", { name: "Badges to feature" });
    await picker.getByLabel(/Newcomer/).check();
    await picker.getByLabel(/Builder/).check();
    await page.getByRole("button", { name: "Save showcase" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Showcase saved" })).toBeVisible();
    const row = page.getByRole("list", { name: "Your showcase" });
    await expect(row.locator("li")).toHaveCount(2);
    await expect(row).toContainText("Newcomer");
    await expect(page.getByText("Showing your top badges")).toHaveCount(0);
    await picker.getByLabel(/Architect/).check();
    await expect(picker.getByLabel(/Founder/)).toBeDisabled();
    await expect(page.getByText("That's 3, the most you can feature")).toBeVisible();
  });

  test("with no badges there is nothing to pick", async ({ page }) => {
    await arrange(page, "user", "badges=none");
    await page.goto("/dashboard");
    await expect(page.getByText("Earn a badge to feature it here.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save showcase" })).toHaveCount(0);
  });

  test("the public profile shows the same showcase", async ({ page }) => {
    await arrange(page, "user");
    await page.goto(`/player/${VISUAL_PLAYER_ID}`);
    await expect(page.getByRole("list", { name: /showcase/ }).locator("li")).toHaveCount(3);
  });
});

test.describe("staff check-in", () => {
  test("open window: the QR rotates by itself", async ({ page }) => {
    await arrange(page, "owner", "window=open");
    await page.goto(ADMIN_CHECK_IN);
    const qr = page.getByRole("img", { name: "Check-in QR code" });
    await expect(qr).toBeVisible();
    const first = await qr.getAttribute("src");
    await expect.poll(() => qr.getAttribute("src"), { timeout: 20_000 }).not.toBe(first);
    await expect(page.getByText(/New code in \d+ s/)).toBeVisible();
  });

  test("before the window: closed state with the opening time", async ({ page }) => {
    await arrange(page, "owner", "window=before");
    await page.goto(ADMIN_CHECK_IN);
    await expect(page.getByText(/Check-in opens at/)).toBeVisible();
    await expect(page.getByRole("img", { name: "Check-in QR code" })).toHaveCount(0);
  });

  test("after the window: closed", async ({ page }) => {
    await arrange(page, "owner", "window=after");
    await page.goto(ADMIN_CHECK_IN);
    await expect(page.getByText("Check-in closed", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "Check-in QR code" })).toHaveCount(0);
  });
});

test.describe("player scan", () => {
  test("signed out goes to sign-in, and the way back is remembered", async ({ page, context }) => {
    await arrange(page, null);
    await page.goto(CHECK_IN);
    await expect(page).toHaveURL(/\/register$/);
    await page.goto(`${CHECK_IN}/start?t=good`);
    await expect(page).toHaveURL(/\/register$/);
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).toContain("cc_next");
    expect(names).toContain("cc_checkin");
  });

  test("signed in without a scan: told to scan, no Check in button", async ({ page }) => {
    await arrange(page, "user");
    await page.goto(CHECK_IN);
    await expect(page.getByText("Scan the QR code on the staff screen")).toBeVisible();
    await expect(page.getByRole("button", { name: "Check in" })).toHaveCount(0);
  });

  test("scan, press Check in, checked in", async ({ page }) => {
    await arrange(page, "user");
    await page.goto(`${CHECK_IN}/start?t=good`);
    await expect(page).toHaveURL(new RegExp(`${CHECK_IN}$`));
    await page.getByRole("button", { name: "Check in" }).click();
    await expect(page.getByText("You're checked in")).toBeVisible();
  });

  test("already checked in", async ({ page }) => {
    await arrange(page, "user", "checkin=already");
    await page.goto(`${CHECK_IN}/start?t=good`);
    await page.getByRole("button", { name: "Check in" }).click();
    await expect(page.getByText("You're already checked in.")).toBeVisible();
  });

  test("an expired code asks for a new scan", async ({ page }) => {
    await arrange(page, "user");
    await page.goto(`${CHECK_IN}/start?t=expired`);
    await expect(page.getByText("Scan the code again")).toBeVisible();
  });

  test("waiting too long (proof refused at the button) asks for a new scan", async ({ page }) => {
    await arrange(page, "user", "checkin=expired");
    await page.goto(`${CHECK_IN}/start?t=good`);
    await page.getByRole("button", { name: "Check in" }).click();
    await expect(page.getByText("Scan the code again")).toBeVisible();
  });

  test("outside the window: closed", async ({ page }) => {
    await arrange(page, "user", "checkin=closed");
    await page.goto(`${CHECK_IN}/start?t=good`);
    await page.getByRole("button", { name: "Check in" }).click();
    await expect(page.getByText("Check-in is closed")).toBeVisible();
  });
});

test.describe("staff scanner", () => {
  test("typed code: recorded, then already, banned, unknown", async ({ page }) => {
    await arrange(page, "owner");
    await page.goto(ADMIN_CHECK_IN);
    const field = page.getByLabel("Player code");
    const submit = page.getByRole("button", { name: "Check in player" });
    await field.fill("cc-abcdefgh23");
    await submit.click();
    await expect(page.getByRole("status").filter({ hasText: "Checked in" })).toContainText("Steve Builder");
    await field.fill("CC-ABCDEFGH23");
    await submit.click();
    await expect(page.getByText("Already checked in", { exact: true })).toBeVisible();
    await field.fill("CC-BANNED2222");
    await submit.click();
    await expect(page.getByRole("alert").filter({ hasText: "banned" })).toBeVisible();
    await field.fill("not a code");
    await submit.click();
    await expect(page.getByRole("alert").filter({ hasText: "Unknown code" })).toBeVisible();
  });

  test("camera denied falls back to the code field", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { BarcodeDetector: unknown }).BarcodeDetector = class { async detect() { return []; } };
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")) } });
    });
    await arrange(page, "owner");
    await page.goto(ADMIN_CHECK_IN);
    await page.getByRole("button", { name: "Scan with camera" }).click();
    await expect(page.getByText("The camera is blocked for this site")).toBeVisible();
    await expect(page.getByLabel("Player code")).toBeFocused();
  });

  test("a browser without BarcodeDetector says to type the code", async ({ page }) => {
    await page.addInitScript(() => { delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector; });
    await arrange(page, "owner");
    await page.goto(ADMIN_CHECK_IN);
    await page.getByRole("button", { name: "Scan with camera" }).click();
    await expect(page.getByText("This browser can't scan codes")).toBeVisible();
    await expect(page.getByLabel("Player code")).toBeFocused();
  });
});

test("award badge to attendees: the count is shown and a second click awards 0", async ({ page }) => {
  await arrange(page, "owner");
  await page.goto(ADMIN_CHECK_IN);
  await page.getByLabel("Player code").fill("CC-ABCDEFGH23");
  await page.getByRole("button", { name: "Check in player" }).click();
  await expect(page.getByRole("list", { name: "Checked-in players" })).toContainText("Steve Builder");
  const award = async (expected: RegExp) => {
    await page.getByLabel("Achievement").selectOption({ label: "Architect" });
    await page.getByRole("button", { name: "Award badge to attendees" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("(1 player)");
    await dialog.getByRole("button", { name: "Award badge", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: expected })).toBeVisible();
  };
  await award(/Awarded 1 player\./);
  await award(/Everyone already has it\./);
});

test("event reminders: offsets save and come back ticked", async ({ page }) => {
  await arrange(page, "owner");
  const url = `/admin/commu/events/${EVENT}`;
  await page.goto(url);
  const day = page.getByLabel("1 day before");
  const hour = page.getByLabel("1 hour before");
  await expect(day).not.toBeChecked();
  await day.check();
  await hour.check();
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Event saved" })).toBeVisible();
  await page.goto(url);
  await expect(day).toBeChecked();
  await expect(hour).toBeChecked();
  await expect(page.getByLabel("1 week before")).not.toBeChecked();
  await day.uncheck();
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Event saved" })).toBeVisible();
  await page.goto(url);
  await expect(day).not.toBeChecked();
  await expect(hour).toBeChecked();
});

test("calendar: the event page offers Add to calendar and the file is a calendar", async ({ page, request }) => {
  await arrange(page, null);
  await page.goto(`/events/${EVENT}`);
  await expect(page.getByRole("link", { name: "Add to calendar" })).toHaveAttribute("href", `/events/${EVENT}/calendar.ics`);
  const res = await request.get(`/events/${EVENT}/calendar.ics`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/calendar");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const body = await res.text();
  expect(body).toContain("BEGIN:VEVENT");
  expect(body).toContain("SUMMARY:Spawn Build Night");
  expect(body).toMatch(/DTSTART:\d{8}T\d{6}Z/);
  expect((await request.get("/events/not-an-id/calendar.ics")).status()).toBe(404);
});

test.describe("notification bell", () => {
  async function bell(page: Page) {
    await page.goto("/events");
    const menu = page.locator("details.mobile-menu > summary");
    if (await menu.isVisible()) await menu.click();
    return page.getByRole("button", { name: /^Notifications/ });
  }

  test("0 unread, opened: nothing yet", async ({ page }) => {
    await arrange(page, "user", "notifs=zero");
    const button = await bell(page);
    await expect(button).toHaveAccessibleName("Notifications");
    await button.click();
    await expect(page.getByRole("region", { name: "Notifications" })).toContainText("Nothing yet");
  });

  test("unread count, then opened: items listed and the count clears", async ({ page }) => {
    await arrange(page, "user", "notifs=unread");
    const button = await bell(page);
    await expect(button).toHaveAccessibleName("Notifications, 2 unread");
    await button.click();
    const panel = page.getByRole("region", { name: "Notifications" });
    await expect(panel).toContainText("You earned Architect");
    await expect(panel).toContainText("Spawn Build Night starts");
    await expect(button).toHaveAccessibleName("Notifications");
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    // On a phone the same Escape also folds the menu the bell sits in, so focus is only checked beside the header.
    if (page.viewportSize()!.width >= 1000) await expect(button).toBeFocused();
  });

  test("a failed load says so and offers Retry", async ({ page }) => {
    await arrange(page, "user", "notifs=error");
    const button = await bell(page);
    await button.click();
    const panel = page.getByRole("region", { name: "Notifications" });
    await expect(panel.getByRole("alert")).toContainText("Couldn't load");
    await expect(panel.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
