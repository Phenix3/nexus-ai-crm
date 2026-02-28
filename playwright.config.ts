import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test configuration.
 * Tests run against the local dev server (or CI preview URL).
 *
 * Required env vars for tests:
 *   E2E_BASE_URL        - App URL (defaults to http://localhost:3000)
 *   E2E_USER_EMAIL      - Primary test user email (must exist in Supabase)
 *   E2E_USER_PASSWORD   - Primary test user password
 *   E2E_USER2_EMAIL     - Secondary test user (for invitation flow)
 *   E2E_USER2_PASSWORD  - Secondary test user password
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // auth flows share state — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Setup project that runs before all tests
    { name: "setup", testMatch: /global\.setup\.ts/ },

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  // Start the Next.js dev server automatically when running locally
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
