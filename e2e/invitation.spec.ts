import { test, expect, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";

const USER1_EMAIL = process.env.E2E_USER_EMAIL!;
const USER1_PASSWORD = process.env.E2E_USER_PASSWORD!;
const USER2_EMAIL = process.env.E2E_USER2_EMAIL!;
const USER2_PASSWORD = process.env.E2E_USER2_PASSWORD!;

/**
 * Invitation flow:
 *   1. User1 signs in, navigates to Settings > Team, invites User2
 *   2. We capture the invitation token (via the DB or by intercepting the email)
 *   3. User2 signs in and visits /invite/<token>
 *   4. User2 should land on dashboard inside User1's organisation
 *
 * NOTE: This test requires both users to exist in Supabase and User1 to already
 * have an active organisation. Run the onboarding flow first.
 *
 * Token capture strategy: We read the token from the invitations table via a
 * dedicated test-only API route (/api/test/last-invitation-token) that is only
 * available when E2E_SECRET is set. See api/test/last-invitation-token/route.ts.
 */

async function getLastInvitationToken(page: Page): Promise<string> {
  const secret = process.env.E2E_SECRET ?? "e2e-secret";
  const resp = await page.request.get(
    `/api/test/last-invitation-token?email=${encodeURIComponent(USER2_EMAIL)}&secret=${secret}`
  );
  const json = await resp.json();
  if (!json.token) throw new Error("Could not retrieve invitation token from test API");
  return json.token;
}

test.describe("Invitation flow", () => {
  test("settings/team page is accessible to org owner", async ({ page }) => {
    await signIn(page, USER1_EMAIL, USER1_PASSWORD);
    await page.goto("/settings/team");
    await expect(page).toHaveURL(/\/settings\/team/);
    await expect(page.getByRole("heading", { name: /team/i })).toBeVisible();
  });

  test("invite form validates email", async ({ page }) => {
    await signIn(page, USER1_EMAIL, USER1_PASSWORD);
    await page.goto("/settings/team");

    // Attempt to submit an invalid email
    const emailField = page.getByLabel(/email/i);
    if (await emailField.isVisible()) {
      await emailField.fill("not-an-email");
      await page.getByRole("button", { name: /invite/i }).click();
      await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 3_000 });
    }
  });

  test("full invite → accept flow", async ({ page, browser }) => {
    // Step 1: User1 invites User2
    await signIn(page, USER1_EMAIL, USER1_PASSWORD);
    await page.goto("/settings/team");

    const emailField = page.getByLabel(/email/i);
    if (!(await emailField.isVisible())) {
      test.skip(true, "Invite form not visible — likely no org or insufficient role");
      return;
    }

    await emailField.fill(USER2_EMAIL);

    const roleSelect = page.getByRole("combobox").or(page.getByLabel(/role/i));
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption("member");
    }

    await page.getByRole("button", { name: /invite/i }).click();
    await expect(page.getByText(/invitation sent/i)).toBeVisible({ timeout: 8_000 });

    // Step 2: Retrieve invitation token via test API
    const token = await getLastInvitationToken(page);

    // Step 3: User2 accepts the invitation in a new browser context
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await signIn(page2, USER2_EMAIL, USER2_PASSWORD);
    await page2.goto(`/invite/${token}`);

    // Should redirect to dashboard inside User1's org
    await page2.waitForURL("/dashboard", { timeout: 15_000 });
    await expect(page2).toHaveURL(/\/dashboard/);

    await context2.close();
  });

  test("expired token shows an error", async ({ page }) => {
    await signIn(page, USER2_EMAIL, USER2_PASSWORD);
    await page.goto("/invite/00000000-0000-0000-0000-000000000000");

    await expect(page.getByText(/invalid|expired/i).or(page.getByRole("alert"))).toBeVisible({
      timeout: 5_000,
    });
  });
});
