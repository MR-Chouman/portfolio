import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const heading = "This page does not exist";
const clientDir = join(process.cwd(), "build", "client");

// Cloudflare Pages serves build/client/404.html, with a 404 status, for every
// URL that matches no file. `npm run preview` serves the same file (with a 200
// status, a sirv limitation), so these tests check the page itself.
test("the build ships a top-level 404.html for Cloudflare Pages", () => {
  expect(existsSync(join(clientDir, "404.html"))).toBe(true);
  expect(existsSync(join(clientDir, "404"))).toBe(false);
  const html = readFileSync(join(clientDir, "404.html"), "utf8");
  expect(html).toContain(heading);
  expect(html).toContain('<meta name="robots" content="noindex"/>');
});

for (const path of ["/no-such-page", "/work/no-such-project", "/a/b/c"]) {
  test(`${path} shows the 404 page`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page).toHaveTitle(/^Page not found/);
    await page.getByRole("link", { name: "Case studies" }).click();
    await expect(page).toHaveURL("/work");
  });
}

test("client-side navigation to a missing route shows the 404 page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  // Every site link points at a real page now that /lab exists (T-051), so
  // navigate through the hydrated router, as an in-app link to a missing
  // route would.
  await page.waitForFunction(() => "__reactRouterDataRouter" in window);
  await page.evaluate(async () => {
    const router = (
      window as unknown as {
        __reactRouterDataRouter: { navigate(to: string): Promise<void> };
      }
    ).__reactRouterDataRouter;
    await router.navigate("/no-such-page");
  });
  await expect(page).toHaveURL("/no-such-page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
});

for (const width of [375, 1440]) {
  test.describe(`404 page at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("has no horizontal scroll or axe violations", async ({ page }) => {
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/no-such-page");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        const results = await new AxeBuilder({ page })
          .withTags(axeTags)
          .analyze();
        expect(results.violations, `${width}px ${theme}`).toEqual([]);
      }
    });
  });
}
