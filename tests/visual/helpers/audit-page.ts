import { expect, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

type AuditOptions = {
  expectedStatus: number;
  path: string;
  expectedPath: string;
  screenshotName: string;
};

export async function auditPage(page: Page, testInfo: TestInfo, options: AuditOptions) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedImages: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const isExpectedDocumentNotFound =
      options.expectedStatus === 404 &&
      text === "Failed to load resource: the server responded with a status of 404 (Not Found)";
    if (!isExpectedDocumentNotFound) consoleErrors.push(text);
  });
  page.on("requestfailed", (request) => {
    if (request.resourceType() === "image") {
      failedImages.push(`${request.url()} (${request.failure()?.errorText ?? "request failed"})`);
    }
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) {
      failedImages.push(`${response.url()} (HTTP ${response.status()})`);
    }
  });

  const navigationResponse = await page.goto(options.path, { waitUntil: "domcontentloaded" });
  expect(new URL(page.url()).pathname, `unexpected redirect from ${options.path}`).toBe(
    options.expectedPath,
  );

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(1, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images, async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }
        await image.decode().catch(() => undefined);
      }),
    );
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });

  const renderState = await page.evaluate(() => {
    const main = document.querySelector("main");
    const brokenImages = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || "unnamed image");
    const mainRect = main?.getBoundingClientRect();
    const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
    return {
      bodyTextLength: bodyText.length,
      brokenImages,
      hasMain: Boolean(main),
      mainHeight: mainRect?.height ?? 0,
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
    };
  });

  const visualCycle = process.env.VISUAL_CYCLE?.match(/^cycle-\d+$/)?.[0] ?? "cycle-01";
  const screenshotDirectory = path.join(process.cwd(), "visual-results", visualCycle);
  mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(screenshotDirectory, `${options.screenshotName}--${testInfo.project.name}.png`),
  });

  expect(navigationResponse?.status(), "unexpected final document response status").toBe(
    options.expectedStatus,
  );
  expect(pageErrors, "uncaught page errors").toEqual([]);
  expect(consoleErrors, "browser console errors").toEqual([]);
  expect(failedImages, "failed image responses").toEqual([]);
  expect(renderState.brokenImages, "broken rendered images").toEqual([]);
  expect(renderState.hasMain, "page must render a main landmark").toBe(true);
  expect(renderState.mainHeight, "main landmark must have meaningful height").toBeGreaterThan(100);
  expect(renderState.bodyTextLength, "page must not render empty content").toBeGreaterThan(20);
  expect(renderState.overflow, "page must not horizontally overflow the viewport").toBeLessThanOrEqual(1);

}
