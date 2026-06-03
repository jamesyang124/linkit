import { expect, test } from "@playwright/test";

test("development server uses https as the default browser protocol", async ({
  page
}) => {
  await page.goto("/");
  expect(page.url()).toMatch(/^https:\/\/localhost:8443\//);
});
