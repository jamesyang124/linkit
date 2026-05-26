import { expect, test } from "@playwright/test";

test("home page presents links as a catalogue gallery", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /catalogue/i })).toBeVisible();
  await expect(page.getByTestId("catalogue-rail")).toBeVisible();
  await expect(page.getByTestId("infinite-gallery")).toBeVisible();
  await expect(page.getByTestId("selection-word")).toBeVisible();

  const railPosition = await page.getByTestId("catalogue-rail").evaluate((element) => {
    return getComputedStyle(element).position;
  });
  expect(railPosition).toBe("sticky");

  const tiles = page.getByTestId("gallery-tile");
  await expect(tiles.first()).toBeVisible();
  expect(await tiles.count()).toBeGreaterThan(0);
});

test("work tiles show image thumbnails", async ({ page }) => {
  await page.goto("/");

  const firstThumb = page.getByTestId("gallery-thumb").first();
  await expect(firstThumb).toBeVisible();

  await expect
    .poll(
      async () => {
        const img = firstThumb.locator("img");
        return img.evaluate((el) =>
          Number.parseFloat(getComputedStyle(el).opacity)
        );
      },
      { timeout: 8000 }
    )
    .toBe(1);
});

test("gallery thumbnails use dynamic image height without framing chrome", async ({ page }) => {
  await page.goto("/");

  const firstThumb = page.getByTestId("gallery-thumb").first();
  const firstImage = firstThumb.locator("img");
  await expect(firstImage).toBeVisible();

  const styles = await firstThumb.evaluate((thumb) => {
    const computed = getComputedStyle(thumb);
    return {
      aspectRatio: computed.aspectRatio,
      backgroundColor: computed.backgroundColor,
      borderTopWidth: computed.borderTopWidth
    };
  });
  expect(styles.aspectRatio).toBe("auto");
  expect(styles.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(styles.borderTopWidth).toBe("0px");

  const thumbBox = await firstThumb.boundingBox();
  const imageBox = await firstImage.boundingBox();
  expect(thumbBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(Math.round(imageBox!.width)).toBe(Math.round(thumbBox!.width));
  expect(Math.round(imageBox!.height)).toBe(Math.round(thumbBox!.height));
});

test("gallery loads the next keyset page", async ({ page }) => {
  await page.goto("/");

  const tiles = page.getByTestId("gallery-tile");
  await expect(tiles.first()).toBeVisible();
  const initialCount = await tiles.count();

  await page.getByTestId("gallery-load-sentinel").scrollIntoViewIfNeeded();

  await expect.poll(() => tiles.count(), { timeout: 8000 }).toBeGreaterThan(initialCount);
});

test("gallery tiles show visit counts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("gallery-tile").first()).toContainText(/visits?/i);
});

test("work gallery does not overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("catalogue-rail")).toBeVisible();
  await expect(page.getByTestId("infinite-gallery")).toBeVisible();
  await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(391);
});
