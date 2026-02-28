import { type Page } from "@playwright/test";

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect away from sign-in
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 10_000 });
}

export async function signOut(page: Page) {
  // Sign out via the sidebar or a dedicated endpoint
  await page.goto("/api/auth/sign-out");
  await page.waitForURL("/sign-in");
}

export async function signUp(page: Page, email: string, password: string, fullName: string) {
  await page.goto("/sign-up");
  await page.getByLabel(/full name/i).fill(fullName);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-up"), { timeout: 10_000 });
}

export async function createOrg(page: Page, name: string, slug: string) {
  await page.waitForURL("/new-org");
  await page.getByLabel(/organisation name/i).fill(name);
  // Slug may auto-populate — clear and fill
  await page.getByLabel(/slug/i).clear();
  await page.getByLabel(/slug/i).fill(slug);
  await page.getByRole("button", { name: /create/i }).click();
  await page.waitForURL("/dashboard", { timeout: 10_000 });
}
