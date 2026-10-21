// Re-shoots the "How to join" guide images on the landing page.
// Needs `next dev` on BASE (default http://localhost:3123) against local Supabase
// with supabase/dev-seed.sql applied. Run: node scripts/capture-join-guide.mjs
import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3123";
const OUT = new URL("../public/images/guide/", import.meta.url).pathname;

const shots = [
  { file: "1-discord.webp", as: null, path: "/register", el: (p) => p.locator("main .stack").nth(1) },
  { file: "2-verify.webp", as: "unverified", path: "/verify", el: (p) => p.getByRole("region", { name: "Verify Chula account" }) },
  { file: "3-minecraft.webp", as: "guest", path: "/settings", el: (p) => p.locator("#add-account") },
  { file: "4-join.webp", as: null, path: "/", el: (p) => p.getByRole("region", { name: "Server address" }) },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await (await browser.newContext({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 })).newPage();
  if (s.as) await page.goto(`${BASE}/api/dev-login?as=${s.as}`);
  await page.goto(BASE + s.path, { waitUntil: "networkidle" });
  // Playwright can only encode jpeg/png, so shoot PNG then convert to webp.
  const png = await s.el(page).screenshot({ type: "png", animations: "disabled" });
  const { width, height } = await sharp(png).webp({ quality: 85, effort: 6 }).toFile(OUT + s.file);
  await page.context().close();
  console.log("saved", s.file, width, height);
}
await browser.close();
