/**
 * Global setup — validates required env vars before the test suite runs.
 *
 * To run the E2E suite you need:
 *   1. A running dev/preview server (configured in playwright.config.ts webServer)
 *   2. Two Supabase test users already created in your project:
 *        E2E_USER_EMAIL / E2E_USER_PASSWORD   (primary — creates orgs, invites)
 *        E2E_USER2_EMAIL / E2E_USER2_PASSWORD (secondary — accepts invitations)
 *   3. The test users should NOT already belong to any organisation before the suite runs.
 *      Between runs, delete the organisations and re-seed via Supabase dashboard or a
 *      `npm run db:reset-test` script (not included here).
 */
import { test as setup } from "@playwright/test";

setup("validate test environment", async () => {
  const required = ["E2E_USER_EMAIL", "E2E_USER_PASSWORD", "E2E_USER2_EMAIL", "E2E_USER2_PASSWORD"];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing E2E environment variables: ${missing.join(", ")}.\n` +
        `Copy .env.test.example to .env.test and fill in the values.`
    );
  }
});
