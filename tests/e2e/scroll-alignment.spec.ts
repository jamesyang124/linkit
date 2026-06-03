/**
 * Scroll alignment tests — permanent regression guard for two scroll bugs:
 *
 * 1. Provider rail click: clicking a provider in the catalogue rail must
 *    scroll that provider's section to the top of the viewport.  Providers
 *    at positions 3+ are the failure cases because their preceding sections
 *    contain lazy-loaded images whose heights aren't known until loaded.
 *
 * 2. Navbar Share button: clicking Share must scroll to #submit (submit-dock)
 *    regardless of how much gallery content is above it (lazy-loaded tiles
 *    push #submit down after the initial scroll).
 */
import { expect, test } from "@playwright/test";

// Tolerance in px for "at the top of the viewport".
// scroll-margin-top on .gallery-section is 1.5rem ≈ 24px.
const TOP_TOLERANCE_PX = 40;

test.describe("provider rail scroll alignment", () => {
  test("clicking the 3rd provider section scrolls it to the top", async ({ page }) => {
    await page.goto("/");

    // Wait for initial gallery tiles to render.
    await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

    // Get rail links — each corresponds to a provider section.
    const railLinks = page.getByTestId("catalogue-rail").locator("ol li a");
    const count = await railLinks.count();
    if (count < 3) {
      test.skip(); // not enough providers in this dataset
      return;
    }

    // Click the 3rd provider (index 2).
    const thirdLink = railLinks.nth(2);
    const providerName = await thirdLink.locator(".rail-name").textContent();
    await thirdLink.click();

    // Build expected section id.
    const sectionId = `section-${providerName!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const section = page.locator(`#${sectionId}`);
    await expect(section).toBeAttached();

    // Wait for ResizeObserver corrections to settle (images load, heights stabilise).
    await page.waitForTimeout(2500);

    // The section header should be at the top of #page-main's viewport.
    const offsetFromTop = await page.evaluate((id) => {
      const container = document.getElementById("page-main");
      const el = document.getElementById(id);
      if (!container || !el) return null;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      return elRect.top - containerRect.top;
    }, sectionId);

    expect(offsetFromTop).not.toBeNull();
    expect(Math.abs(offsetFromTop!)).toBeLessThanOrEqual(TOP_TOLERANCE_PX);
  });

  test("clicking the 4th provider section scrolls it to the top", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

    const railLinks = page.getByTestId("catalogue-rail").locator("ol li a");
    const count = await railLinks.count();
    if (count < 4) {
      test.skip();
      return;
    }

    const fourthLink = railLinks.nth(3);
    const providerName = await fourthLink.locator(".rail-name").textContent();
    await fourthLink.click();

    const sectionId = `section-${providerName!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const section = page.locator(`#${sectionId}`);
    await expect(section).toBeAttached();

    await page.waitForTimeout(2500);

    const offsetFromTop = await page.evaluate((id) => {
      const container = document.getElementById("page-main");
      const el = document.getElementById(id);
      if (!container || !el) return null;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      return elRect.top - containerRect.top;
    }, sectionId);

    expect(offsetFromTop).not.toBeNull();
    expect(Math.abs(offsetFromTop!)).toBeLessThanOrEqual(TOP_TOLERANCE_PX);
  });
});

test.describe("share button scroll", () => {
  test("clicking Share on home page scrolls to submit-dock", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

    // The Share link is in the navbar.
    const shareLink = page.locator('a[href="/#submit"]');
    await shareLink.click();

    // Wait for ResizeObserver corrections to settle.
    await page.waitForTimeout(2500);

    const submitDock = page.getByTestId("submit-dock");
    await expect(submitDock).toBeVisible();

    // Verify it's at or near the top of #page-main, not just "somewhere on page".
    const offsetFromTop = await page.evaluate(() => {
      const container = document.getElementById("page-main");
      const el = document.querySelector("[data-testid='submit-dock']");
      if (!container || !el) return null;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      return elRect.top - containerRect.top;
    });

    expect(offsetFromTop).not.toBeNull();
    // #submit is the last element — browser scrolls to max-scroll, putting the
    // section top at (clientHeight − submitDockHeight).  Verify it's inside the
    // viewport AND page-main is at its maximum scroll position (± 5 px rounding).
    const clientHeight = await page.evaluate(() => document.getElementById("page-main")!.clientHeight);
    expect(offsetFromTop!).toBeLessThan(clientHeight);
    const atBottom = await page.evaluate(() => {
      const pm = document.getElementById("page-main")!;
      return pm.scrollTop >= pm.scrollHeight - pm.clientHeight - 5;
    });
    expect(atBottom).toBe(true);
  });

  test("clicking Share from top of home page scrolls to bottom (submit-dock visible)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("gallery-tile").first()).toBeVisible();

    // Ensure we start from the very top.
    await page.evaluate(() => {
      document.getElementById("page-main")?.scrollTo({ top: 0, behavior: "instant" });
    });

    const shareLink = page.locator('a[href="/#submit"]');
    await shareLink.click();

    await page.waitForTimeout(3000);

    const submitDock = page.getByTestId("submit-dock");
    await expect(submitDock).toBeVisible();

    const clientHeight2 = await page.evaluate(() => document.getElementById("page-main")!.clientHeight);
    const offsetFromTop2 = await page.evaluate(() => {
      const container = document.getElementById("page-main");
      const el = document.querySelector("[data-testid='submit-dock']");
      if (!container || !el) return null;
      return el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    });
    expect(offsetFromTop2).not.toBeNull();
    expect(offsetFromTop2!).toBeLessThan(clientHeight2);
    const atBottom2 = await page.evaluate(() => {
      const pm = document.getElementById("page-main")!;
      return pm.scrollTop >= pm.scrollHeight - pm.clientHeight - 5;
    });
    expect(atBottom2).toBe(true);
  });
});
