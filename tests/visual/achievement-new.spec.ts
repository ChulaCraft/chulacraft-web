import { expect, test, type Page } from "@playwright/test";
import { resetVisualSession, visualSession } from "./helpers/visual-auth";
import { stubUrl } from "./helpers/ports.mjs";

// AC 23: a failed create stays on /admin/commu/achievements/new, names the cause
// and keeps the typed text (stubs/achievement-new.mjs decides what fails).
const PNG = { name: "badge.png", mimeType: "image/png", buffer: Buffer.from("89504e470d0a1a0a", "hex") };

const failing = (fail: "upload" | "save" | "none") => fetch(`${stubUrl}/__visual/achievement-new?fail=${fail}`, { method: "POST" });
const calls = async (): Promise<string[]> => (await fetch(`${stubUrl}/__visual/achievement-new`)).json();
const alert = (page: Page) => page.locator("main").getByRole("alert");

async function open(page: Page) {
  await visualSession(page, "owner");
  await failing("none");
  await page.goto("/admin/commu/achievements/new");
  await page.getByLabel("Name").fill("Miner");
  await page.getByLabel(/Description/).fill("Dug deep.");
  await page.getByLabel("Status").selectOption("published");
  await page.getByLabel("Tier").selectOption("epic");
}

async function expectKept(page: Page) {
  await expect(page).toHaveURL(/\/admin\/commu\/achievements\/new$/);
  await expect(page.getByLabel("Name")).toHaveValue("Miner");
  await expect(page.getByLabel(/Description/)).toHaveValue("Dug deep.");
  await expect(page.getByLabel("Status")).toHaveValue("published");
}

test.afterAll(resetVisualSession);

test("a wrong image type stays on /new with the typed text", async ({ page }) => {
  await open(page);
  await page.getByLabel("Image").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(alert(page)).toContainText("isn't a PNG, JPEG, WebP or GIF");
  await expectKept(page);
  await expect(page.getByLabel("Tier")).toHaveValue("epic");
  expect(await calls()).toEqual([]);
});

test("an oversize image stays on /new with the typed text", async ({ page }) => {
  await open(page);
  await page.getByLabel("Image").setInputFiles({ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(2097153) });
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(alert(page)).toContainText("bigger than 2 MB");
  await expectKept(page);
});

test("a failed upload stays on /new and creates nothing", async ({ page }) => {
  await open(page);
  await failing("upload");
  await page.getByLabel("Image").setInputFiles(PNG);
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(alert(page)).toContainText("couldn't be uploaded");
  await expectKept(page);
  expect(await calls()).toEqual(["upload"]);
});

test("a refused save stays on /new and removes the uploaded image", async ({ page }) => {
  await open(page);
  await failing("save");
  await page.getByLabel("Image").setInputFiles(PNG);
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(alert(page)).toContainText("permission");
  await expectKept(page);
  expect(await calls()).toEqual(["upload", "admin_upsert_achievement", "remove"]);
});

test("a refused tier deletes the new row and image, keeps the text and says nothing was created", async ({ page }) => {
  await open(page);
  await page.getByLabel("Tier").selectOption("legendary");
  await page.getByLabel("Image").setInputFiles(PNG);
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(alert(page)).toContainText("Nothing was created");
  await expectKept(page);
  await expect(page.getByLabel("Tier")).toHaveValue("legendary");
  expect(await calls()).toEqual(["upload", "admin_upsert_achievement", "admin_set_achievement_meta", "admin_delete_achievement", "remove"]);
});

test("a good create leaves /new for the new achievement", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Create achievement" }).click();
  await expect(page).toHaveURL(/\/admin\/commu\/achievements\/[0-9a-f-]{36}/);
});
