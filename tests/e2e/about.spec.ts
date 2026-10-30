import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sections = ["Story", "Experience", "Skills", "Education"];
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("about is prerendered with its own title and Open Graph tags", async ({
  request,
}) => {
  const html = await (await request.get("/about")).text();
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  expect(title).toMatch(/^About/);
  expect(html).toContain(`<meta property="og:title" content="${title}"/>`);
  expect(html).toMatch(/<link rel="canonical" href="[^"]+\/about\/"\/>/);
  // The content is in the HTML before JavaScript runs.
  expect(html).toContain("Experience");
});

test("the header navigation and the home teaser reach it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "More about me" }).click();
  await expect(page).toHaveURL("/about");
});

for (const width of [375, 768, 1440]) {
  test.describe(`about at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("shows every section without horizontal scroll or axe violations", async ({
      page,
    }) => {
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        const response = await page.goto("/about");
        expect(response?.status()).toBe(200);
        for (const name of sections) {
          await expect(page.getByRole("region", { name })).toBeVisible();
        }
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
