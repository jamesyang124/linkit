import { expect, test } from "@playwright/test";

const routes = ["/", "/signin", "/register"];

test.describe("persistent navigation", () => {
  for (const route of routes) {
    test(`renders on ${route}`, async ({ page }) => {
      await page.goto(route);

      const nav = page.getByTestId("site-nav");
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: "Linkit" })).toHaveAttribute(
        "href",
        "/"
      );
      await expect(nav.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/signin"
      );
    });
  }

  test("sign in links to sign-in page", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("site-nav").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/signin");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("register accessible from sign-in page", async ({ page }) => {
    await page.goto("/signin");

    await page.getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL("/register");
    await expect(page.getByRole("heading", { name: /register/i })).toBeVisible();
  });

  test("does not overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByTestId("site-nav")).toBeVisible();
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(391);
    }
  });
});
