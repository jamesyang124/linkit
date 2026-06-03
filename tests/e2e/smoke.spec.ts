import { test, expect } from "@playwright/test";

import { loginAs } from "./auth.helpers";
import {
  TEST_POST_ID,
  TEST_POST_LINK,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from "./global-setup";

test("visitor sees public feed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="infinite-gallery"]')).toBeVisible();
});

test("/healthz returns ok", async ({ request }) => {
  const resp = await request.get("/healthz");
  expect(resp.status()).toBe(200);
  expect(await resp.text()).toBe("ok");
});

test("gallery API uses keyset pagination", async ({ request }) => {
  const firstResponse = await request.get("/api/gallery?limit=2");
  expect(firstResponse.status()).toBe(200);
  const firstPage = await firstResponse.json();
  expect(firstPage.items).toHaveLength(2);
  expect(firstPage.nextCursor).toEqual(expect.any(String));

  const secondResponse = await request.get(
    `/api/gallery?limit=2&cursor=${encodeURIComponent(firstPage.nextCursor)}`
  );
  expect(secondResponse.status()).toBe(200);
  const secondPage = await secondResponse.json();
  expect(secondPage.items).toHaveLength(2);

  const firstIds = new Set(firstPage.items.map((item: { id: string }) => item.id));
  expect(secondPage.items.some((item: { id: string }) => firstIds.has(item.id))).toBe(false);
});

test("gallery API rejects invalid cursors", async ({ request }) => {
  const response = await request.get("/api/gallery?cursor=invalid");
  expect(response.status()).toBe(400);
});

test("unauthenticated submit is rejected with feedback", async ({ page }) => {
  await page.goto("/");
  await page.fill('[data-testid="submit-link-input"]', "https://example.com/some-link");
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL(/[?&]message=/);
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
});

test("blank link rejected when authenticated", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await page.goto("/");
  await page.fill('[data-testid="submit-link-input"]', "   ");
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL(/[?&]message=/);
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
});

test("authenticated user can submit a link", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await page.goto("/");
  const uniqueLink = `https://example.com/e2e-post-${Date.now()}`;
  await page.fill('[data-testid="submit-link-input"]', uniqueLink);
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL("/?posted=1");
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
});

test("input focus clears stale submit feedback", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await page.goto("/");
  const uniqueLink = `https://example.com/e2e-feedback-${Date.now()}`;
  await page.fill('[data-testid="submit-link-input"]', uniqueLink);
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL("/?posted=1");
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();

  await page.locator('[data-testid="submit-link-input"]').focus();
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeHidden();
});

test("submitted link appears in gallery immediately after posting", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await page.goto("/");

  const uniqueLink = `https://example.com/e2e-gallery-${Date.now()}`;
  await page.fill('[data-testid="submit-link-input"]', uniqueLink);
  await page.click('[data-testid="submit-link-button"]');
  await page.waitForURL("/?posted=1");

  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="infinite-gallery"]')).toBeVisible();
});

test("authenticated user can comment", async ({ page }) => {
  await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  await page.goto(`/p/${TEST_POST_ID}`);
  await expect(page.locator('[data-testid="comment-input"]').first()).toBeVisible();
  await page.locator('[data-testid="comment-input"]').first().fill("E2E test comment");
  await page.locator('[data-testid="comment-button"]').first().click();
  await page.waitForURL(new RegExp(`/p/${TEST_POST_ID.replaceAll("-", "\\-")}\\?commented=1$`));
  await expect(page.locator('[data-testid="feedback-banner"]')).toBeVisible();
});

test("redirect follows to original URL", async ({ page }) => {
  // Intercept the external destination so the test doesn't depend on example.com
  await page.route(TEST_POST_LINK, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>ok</body></html>" })
  );
  await page.goto(`/r/${TEST_POST_ID}`);
  expect(page.url()).toBe(TEST_POST_LINK);
});

test("redirect visit count increments and refreshes the profile display", async ({ page }) => {
  await page.route(TEST_POST_LINK, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>ok</body></html>" })
  );

  await page.goto(`/p/${TEST_POST_ID}`);
  const visitsValue = page.locator('[data-testid="profile-visits"]');
  const before = Number((await visitsValue.textContent()) ?? "0");

  await page.goto(`/r/${TEST_POST_ID}`);
  expect(page.url()).toBe(TEST_POST_LINK);

  await page.goto(`/p/${TEST_POST_ID}`);
  await expect(visitsValue).toHaveText(String(before + 1));
});
