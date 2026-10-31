import { defineConfig, devices } from "@playwright/test";
import { visualManagerKey } from "./tests/visual/helpers/manager-key.mjs";
import { appPort as port, appUrl as baseURL, managerPort, managerUrl, stubUrl } from "./tests/visual/helpers/ports.mjs";

// The manager mock (scripts/local-mocks.mjs --manager-only) for /admin/ops runs on managerPort.

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  outputDir: "visual-results/test-artifacts",
  use: {
    baseURL,
    colorScheme: "dark",
    locale: "en-US",
    reducedMotion: "reduce",
    screenshot: "off",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-375x812",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "mobile-430x932",
      use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } },
    },
    {
      name: "tablet-768x1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop-1440x900",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: "node tests/visual/helpers/supabase-stub.mjs",
      url: `${stubUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: "node scripts/local-mocks.mjs --manager-only",
      // Unauthenticated /services answers 401, which Playwright counts as ready.
      url: `${managerUrl}/services`,
      env: { MCSV_JWT_PRIVATE_KEY: visualManagerKey, MOCK_MANAGER_PORT: String(managerPort) },
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command:
        `export NEXT_PUBLIC_SUPABASE_URL=${stubUrl} NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_visual_audit SUPABASE_SECRET_KEY=sb_secret_visual_audit; npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
      // Absolute canonical and og:image URLs (metadataBase) point back at this server.
      env: { MCSV_JWT_PRIVATE_KEY: visualManagerKey, MCSV_MANAGER_URL: managerUrl, NEXT_PUBLIC_SITE_URL: baseURL },
      url: `${baseURL}/images/chulacraft-logo.webp`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
