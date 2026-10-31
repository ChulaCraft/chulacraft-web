#!/usr/bin/env node
// Lighthouse mobile audit of the four public pages.
//
//   node scripts/lighthouse.mjs <baseUrl> <eventId> <playerId>
//   (or BASE_URL / EVENT_ID / PLAYER_ID in the environment)
//
// /player/[id] is signed-in only (signed out it redirects to /register). Set PLAYER_COOKIE to a
// signed-in Cookie header value (for example "sb-127-auth-token=base64-...") and the player page
// alone is audited with it, through lighthouse --extra-headers. Without it the player row is
// marked "signed out" and is not a measurement of /player/[id]. See docs/perf-baseline.md.
//
// Runs `npx lighthouse@12 <url> --preset=perf --form-factor=mobile
// --only-categories=accessibility,seo,best-practices,performance --output=json`
// per page, prints the scores and LCP, and exits 1 if any page has Accessibility, SEO or
// Best Practices below 95, or LCP at or above 2500 ms. Needs Chrome: set CHROME_PATH (for example
// to Playwright's chromium) when there is no system Chrome.

import { spawnSync } from "node:child_process";

const [baseArg, eventArg, playerArg] = process.argv.slice(2);
const base = (baseArg ?? process.env.BASE_URL ?? "").replace(/\/$/, "");
const eventId = eventArg ?? process.env.EVENT_ID;
const playerId = playerArg ?? process.env.PLAYER_ID;
if (!base || !eventId || !playerId) {
  console.error("usage: node scripts/lighthouse.mjs <baseUrl> <eventId> <playerId>");
  process.exit(2);
}

const playerCookie = process.env.PLAYER_COOKIE ?? "";

// Lighthouse 12's mobile user agent plus the "Chrome-Lighthouse" token that PageSpeed Insights
// sends. Next streams generateMetadata output into <body> for ordinary browsers but blocks and
// puts it in <head> for UAs in its HTML-limited-bot list, which includes Chrome-Lighthouse. The
// Lighthouse CLI's own UA lacks the token, and its meta-description audit reads <head> only, so
// without this the dynamic pages (/events/[id], /player/[id]) score SEO 100 or 92 depending on
// whether metadata won the race to the head flush. See docs/perf-baseline.md.
const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse";

const MIN_SCORE = 95;
const MAX_LCP_MS = 2500;
const pages = [
  ["home", "/"],
  ["events", "/events"],
  ["event", `/events/${eventId}`],
  ["player", `/player/${playerId}`, playerCookie],
];

let failed = false;
const rows = [];
for (const [name, path, cookie] of pages) {
  const run = spawnSync(
    "npx",
    ["--yes", "lighthouse@12", `${base}${path}`, "--preset=perf", "--form-factor=mobile",
      "--only-categories=accessibility,seo,best-practices,performance", "--output=json", "--quiet",
      "--chrome-flags=--headless=new --no-sandbox", `--emulated-user-agent=${USER_AGENT}`,
      ...(cookie ? [`--extra-headers=${JSON.stringify({ Cookie: cookie })}`] : [])],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  let lhr;
  try {
    lhr = JSON.parse(run.stdout);
  } catch {
    console.error(`${name} ${path}: lighthouse produced no JSON (exit ${run.status})\n${run.stderr}`);
    failed = true;
    continue;
  }
  const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
  const row = {
    page: name,
    path,
    a11y: score("accessibility"),
    seo: score("seo"),
    bp: score("best-practices"),
    perf: score("performance"),
    lcpMs: Math.round(lhr.audits["largest-contentful-paint"]?.numericValue ?? NaN),
    // What was actually audited: a redirect (signed out on /player) shows up here.
    finalPath: new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl ?? `${base}${path}`).pathname,
  };
  rows.push(row);
  if (row.finalPath !== path) {
    console.error(`${name} ${path}: redirected to ${row.finalPath}${name === "player" && !cookie ? " (set PLAYER_COOKIE)" : ""}`);
    failed = true;
  }
  if (row.a11y < MIN_SCORE || row.seo < MIN_SCORE || row.bp < MIN_SCORE || !(row.lcpMs < MAX_LCP_MS)) failed = true;
}

console.log("page    a11y  seo   bp    perf  LCP(ms)  path");
for (const r of rows) {
  console.log(`${r.page.padEnd(7)} ${String(r.a11y).padEnd(5)} ${String(r.seo).padEnd(5)} ${String(r.bp).padEnd(5)} ${String(r.perf).padEnd(5)} ${String(r.lcpMs).padEnd(8)} ${r.path}${r.finalPath !== r.path ? ` -> ${r.finalPath}` : ""}`);
}
console.log(failed ? "FAIL (a11y/SEO/BP < 95, LCP >= 2500 ms, a redirect, or a run failed)" : "PASS");
process.exit(failed ? 1 : 0);
