import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  timeout: 30_000,
  use: {
    baseURL: "https://localhost:8443",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "https://localhost:8443/healthz",
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-test-secret-do-not-use-in-prod",
      NEXTAUTH_URL: "https://localhost:8443",
    },
  },
  globalSetup: "./tests/e2e/global-setup.ts",
});
