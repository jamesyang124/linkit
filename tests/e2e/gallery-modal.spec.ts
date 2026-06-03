import { expect, test } from "@playwright/test";

test.describe("gallery tile expand modal", () => {
  test("clicking tile opens centered expanded panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

    await page.getByTestId("gallery-tile").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Panel is centered in viewport
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    const centerX = box!.x + box!.width / 2;
    expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(10);
  });

  test("ESC closes the expanded panel", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("gallery-tile").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("clicking backdrop closes the panel", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("gallery-tile").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click the backdrop (outside the panel, near top-left corner)
    await page.mouse.click(10, 10);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("expanded panel shows comment section", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("gallery-tile").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await expect(page.getByTestId("comment-input")).toBeVisible();
  });

  test("expanded panel has visit link", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("gallery-tile").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const visitLink = page.getByRole("dialog").getByRole("link", { name: /visit/i });
    await expect(visitLink).toBeVisible();
    const href = await visitLink.getAttribute("href");
    expect(href).not.toBeNull();
  });

  test("tile stats text has symmetric spacing around it", async ({ page }) => {
    await page.goto("/");
    const firstTile = page.getByTestId("gallery-tile").first();
    await expect(firstTile).toBeVisible();

    // Stats row should be present inside the tile
    const statsRow = firstTile.locator(".gallery-tile-stats");
    await expect(statsRow).toBeVisible();

    // Measure margin-top and padding-bottom are equal (even spacing)
    const spacing = await statsRow.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        marginTop: parseFloat(s.marginTop),
        paddingBottom: parseFloat(s.paddingBottom)
      };
    });
    expect(spacing.marginTop).toBeCloseTo(spacing.paddingBottom, 0);
  });
});
