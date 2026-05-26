import { expect, test } from "@playwright/test";

import { loginAs } from "./auth.helpers";
import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "./global-setup";

test.describe("sign-in page", () => {
  test("visitor opens /signin and sees styled form", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("invalid sign-in shows styled feedback", async ({ page }) => {
    await page.goto("/signin");
    await page.fill('input[name="email"]', "nobody@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(
      /invalid/i
    );
  });

  test("input focus clears sign-in feedback", async ({ page }) => {
    await page.goto("/signin");
    await page.fill('input[name="email"]', "nobody@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();

    await page.locator('input[name="email"]').focus();
    await expect(page.locator('[data-testid="auth-error"]')).toBeHidden();
  });
});

test.describe("register page", () => {
  test("visitor opens /register and sees styled form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /register/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("invalid registration shows styled feedback", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', "new-user@example.com");
    await page.fill('input[name="password"]', "short");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(
      /at least 8/i
    );
  });

  test("input focus clears registration feedback", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', "new-user@example.com");
    await page.fill('input[name="password"]', "short");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();

    await page.locator('input[name="password"]').focus();
    await expect(page.locator('[data-testid="auth-error"]')).toBeHidden();
  });
});

test("signed-in nav renders upper-case sign out", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await expect(page.getByTestId("site-nav").getByRole("button", { name: "SIGN OUT" })).toBeVisible();
});

test("visitor can register, then sign in, then submit a link", async ({
  page
}) => {
  const email = `e2e-reg-${Date.now()}@example.com`;
  const password = "testpassword123";

  await page.goto("/register");
  await page.fill('input[name="name"]', "E2E Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /create/i }).click();
  await page.waitForURL(/\/signin/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("/");

  const link = `https://example.com/e2e-reg-${Date.now()}`;
  await page.fill('[data-testid="submit-link-input"]', link);
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL("/?posted=1");
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
});
