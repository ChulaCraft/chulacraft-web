// Re-shoots the "How to join" guide images on the landing page.
// Needs `next dev` on BASE (default http://localhost:3123) against local Supabase
// with supabase/dev-seed.sql applied. Run: node scripts/capture-join-guide.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3123";
const OUT = new URL("../public/images/guide/", import.meta.url).pathname;

const shots = [
  { file: "1-discord.webp", as: null, path: "/register", el: (p) => p.locator("main .stack").nth(1) },
  { file: "2-verify.webp", as: "unverified", path: "/verify", el: (p) => p.getByRole("region", { name: "Verify Chula account" }) },
  { file: "3-minecraft.webp", as: "guest", path: "/dashboard", el: (p) => p.locator("#add-account") },
  { file: "4-join.webp", as: null, path: "/", el: (p) => p.getByRole("region", { name: "Server address" }) },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await (await browser.newContext({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 })).newPage();
  if (s.as) await page.goto(`${BASE}/api/dev-login?as=${s.as}`);
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  // Playwright can only encode jpeg/png, so shoot PNG then convert to webp.
  const tmp = OUT + s.file.replace(/\.webp$/, ".tmp.png");
  await s.el(page).screenshot({ path: tmp, type: "png", animations: "disabled" });
  execFileSync("magick", [tmp, "-quality", "85", "-define", "webp:method=6", OUT + s.file]);
  fs.rmSync(tmp);
  await page.context().close();
  console.log("saved", s.file);
}
await browser.close();
