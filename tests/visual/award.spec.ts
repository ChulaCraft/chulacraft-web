import { expect, test } from "@playwright/test";
import { stubUrl } from "./helpers/ports.mjs";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";

// Tick-box award page against the award stub (helpers/stubs/award.mjs): 120
// players, Player 001 and 002 already hold the achievement.
const PAGE = "/admin/commu/achievements/00000000-0000-4000-8000-0000000a0001/award";
const award = (on: boolean) => fetch(`${stubUrl}/__visual/award?on=${on ? 1 : 0}`, { method: "POST" });

test.beforeEach(async ({ page }) => {
  await award(true);
  await visualSession(page, "owner");
});
test.afterAll(async () => {
  await award(false);
  await resetVisualSession();
});

const count = (page: import("@playwright/test").Page) => page.getByTestId("ticked-count");
const box = (page: import("@playwright/test").Page, name: string) => page.getByRole("checkbox", { name: new RegExp(name) });

test("one paged list, typing filters without a page load, Select all filtered ticks every match", async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole("list", { name: "Players" }).getByRole("listitem")).toHaveCount(50);
  await expect(page.getByText("Page 1 of 3")).toBeVisible();
  let navigated = false;
  page.on("framenavigated", () => { navigated = true; });
  await page.getByLabel("Filter players").fill("Player 11");
  await expect(page.getByRole("list", { name: "Players" }).getByRole("listitem")).toHaveCount(10);
  expect(navigated).toBe(false);
  await page.getByRole("button", { name: "Select all filtered" }).click();
  await expect(count(page)).toHaveText("10 ticked");
  await expect(page.getByRole("button", { name: "Award 10 players" })).toBeEnabled();
});

test("ticks survive a filter change and paging; there is no Add ticked control", async ({ page }) => {
  await page.goto(PAGE);
  await box(page, "Player 010").check();
  await page.getByLabel("Filter players").fill("Player 11");
  await expect(page.getByRole("list", { name: "Players" }).getByRole("listitem")).toHaveCount(10);
  await page.getByLabel("Filter players").fill("");
  await expect(page.getByText("Page 1 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 3")).toBeVisible();
  await box(page, "Player 060").check();
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(box(page, "Player 010")).toBeChecked();
  await expect(count(page)).toHaveText("2 ticked");
  await expect(page.getByRole("button", { name: /Add ticked/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Award 2 players" })).toBeVisible();
});

test("existing recipients are checked, disabled and not counted", async ({ page }) => {
  await page.goto(PAGE);
  await expect(box(page, "Player 001")).toBeChecked();
  await expect(box(page, "Player 001")).toBeDisabled();
  await expect(count(page)).toHaveText("0 ticked");
  await page.getByRole("button", { name: "Select all filtered" }).click();
  await expect(count(page)).toHaveText("118 ticked");
});

test("a pasted list and the interested prefill tick rows in the same list", async ({ page }) => {
  await page.goto(PAGE);
  await page.getByLabel("Paste names, one per line").fill("discord\nPlayer 020\nplayer 021\nPlayer 020\nnobody");
  await page.getByRole("button", { name: "Tick matches" }).click();
  await expect(page.getByRole("list", { name: "List result" }).or(page.getByLabel("List result"))).toContainText("nobody");
  await expect(box(page, "Player 020")).toBeChecked();
  await expect(count(page)).toHaveText("2 ticked");
  await page.getByLabel("Event", { exact: true }).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Tick interested players" }).click();
  await expect(count(page)).toHaveText("5 ticked");
  await expect(box(page, "Player 005")).toBeChecked();
});

test("awarding reports only the players who were really added", async ({ page }) => {
  await page.goto(PAGE);
  await box(page, "Player 030").check();
  await page.getByRole("button", { name: "Award 1 player" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Awarded to 1 new player" })).toBeVisible();
  await expect(box(page, "Player 030")).toBeDisabled();
});
