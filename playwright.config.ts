import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The skin switch (T-042) must work in every major engine; the other
    // specs run in Chromium only, to keep CI fast.
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: "skin-switcher.spec.ts",
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: "skin-switcher.spec.ts",
    },
  ],
  // Tests run against the prerendered static output, as deployed.
  webServer: {
    command: "npm run build && npm run preview",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
