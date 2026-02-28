import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL!;
const PASSWORD = process.env.E2E_USER_PASSWORD!;

test.describe("Authentication", () => {
  test("sign-in page is reachable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/sign in/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("sign-up page is reachable", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveTitle(/sign up|create account/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("unauthenticated user is redirected to sign-in from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthenticated user is redirected to sign-in from contacts", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in with valid credentials redirects to app", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should land on /dashboard or /new-org or /select-org (depending on org setup)
    await page.waitForURL(
      (url) =>
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/new-org") ||
        url.pathname.startsWith("/select-org"),
      { timeout: 10_000 }
    );
  });

  test("sign-in with wrong password shows error", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill("wrong-password-xyz");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert").or(page.locator("[data-error]"))).toBeVisible({
      timeout: 5_000,
    });
    // Should stay on sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
