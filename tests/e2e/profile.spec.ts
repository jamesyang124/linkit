import { expect, test } from "@playwright/test";

import { TEST_POST_ID } from "./global-setup";

test("gallery item opens a Pinterest-like profile detail page", async ({ page }) => {
  await page.goto("/");

  await page.locator(`a[href="/p/${TEST_POST_ID}"]`).first().click();

  await expect(page).toHaveURL(`/p/${TEST_POST_ID}`);
  await expect(page.getByTestId("profile-pin")).toBeVisible();
  await expect(page.getByTestId("profile-image")).toBeVisible();
  await expect(page.getByTestId("profile-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Test Article" })).toBeVisible();

  const imageBox = await page.getByTestId("profile-image").boundingBox();
  const detailBox = await page.getByTestId("profile-detail").boundingBox();
  expect(imageBox).not.toBeNull();
  expect(detailBox).not.toBeNull();
  expect(imageBox!.x).toBeLessThan(detailBox!.x);
});
