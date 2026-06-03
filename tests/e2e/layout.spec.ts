import { expect, test } from "@playwright/test";

test("home page carries the Briganti-style infinite catalogue layout", async ({
  page
}) => {
  await page.goto("/");

  const gallery = page.getByTestId("infinite-gallery");
  const rail = page.getByTestId("catalogue-rail");
  const selectionWord = page.getByTestId("selection-word");
  const firstTile = page.getByTestId("gallery-tile").first();

  await expect(gallery).toBeVisible();
  await expect(rail).toBeVisible();
  await expect(selectionWord).toBeVisible();
  await expect(page.getByRole("heading", { name: /catalogue/i })).toBeVisible();
  await expect(firstTile).toBeVisible();

  await expect(page.getByTestId("hero")).toHaveCount(0);
  await expect(page.getByTestId("info-panel")).toHaveCount(0);

  const navTextTransform = await page.getByTestId("site-nav").evaluate((element) => {
    return getComputedStyle(element).textTransform;
  });
  expect(navTextTransform).toBe("uppercase");

  const galleryWidth = await gallery.evaluate((element) => {
    return element.getBoundingClientRect().width;
  });
  expect(galleryWidth).toBeLessThanOrEqual(1120);

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewportWidth = page.viewportSize()?.width ?? 0;
  expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 1);
});

test("infinite catalogue remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("infinite-gallery")).toBeVisible();
  await expect(page.getByTestId("catalogue-rail")).toBeVisible();
  await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(391);

  const galleryBox = await page.getByTestId("infinite-gallery").boundingBox();
  const navBox = await page.getByTestId("site-nav").boundingBox();
  expect(galleryBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(navBox!.y + navBox!.height).toBeLessThan(galleryBox!.y + 4);
});
