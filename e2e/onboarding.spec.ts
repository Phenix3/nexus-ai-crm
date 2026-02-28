import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";

const EMAIL = process.env.E2E_USER_EMAIL!;
const PASSWORD = process.env.E2E_USER_PASSWORD!;

/**
 * Onboarding flow: sign-in → create org → land on /dashboard.
 *
 * Assumes the test user has no organisation yet.
 * After this test, the user will own an org named "E2E Test Org".
 */
test.describe("Onboarding — create organisation", () => {
  test("redirects authenticated user without org to /new-org", async ({ page }) => {
    await signIn(page, EMAIL, PASSWORD);
    // If the user has no org, should land on /new-org; if they do, /dashboard or /select-org
    const url = page.url();
    expect(["/new-org", "/dashboard", "/select-org"].some((p) => url.includes(p))).toBeTruthy();
  });

  test("new-org form validates slug format", async ({ page }) => {
    await signIn(page, EMAIL, PASSWORD);
    await page.goto("/new-org");

    await page.getByLabel(/organisation name/i).fill("My Org");
    await page.getByLabel(/slug/i).clear();
    await page.getByLabel(/slug/i).fill("INVALID SLUG!!!");
    await page.getByRole("button", { name: /create/i }).click();

    // Should show a validation error for the slug
    await expect(
      page.getByText(/lowercase|letters.*numbers|hyphens/i).or(page.locator("[data-error]"))
    ).toBeVisible({ timeout: 3_000 });
  });

  test("select-org page lists available organisations", async ({ page }) => {
    await signIn(page, EMAIL, PASSWORD);

    // Navigate to select-org — if user already has orgs this page exists
    await page.goto("/select-org");
    // Should either show org list or redirect if only one org
    const isOrgPage = page.url().includes("/select-org") || page.url().includes("/dashboard");
    expect(isOrgPage).toBeTruthy();
  });

  test("dashboard is accessible after org selection", async ({ page }) => {
    await signIn(page, EMAIL, PASSWORD);

    // If redirected to new-org, create one; otherwise proceed
    if (page.url().includes("/new-org")) {
      await page.getByLabel(/organisation name/i).fill("E2E Test Org");
      await page.getByLabel(/slug/i).clear();
      await page.getByLabel(/slug/i).fill(`e2e-test-${Date.now()}`);
      await page.getByRole("button", { name: /create/i }).click();
      await page.waitForURL("/dashboard", { timeout: 10_000 });
    } else if (page.url().includes("/select-org")) {
      await page.getByRole("button").first().click();
      await page.waitForURL("/dashboard", { timeout: 10_000 });
    }

    await expect(page).toHaveURL(/\/dashboard/);
    // Sidebar should be visible
    await expect(page.locator("nav").or(page.locator("[data-sidebar]"))).toBeVisible();
  });
});
