import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sections = [
  "In numbers",
  "Four platforms, one foundation",
  "Reusable foundations first",
  "From biology to frontend lead",
  "Get in touch",
];

test("home is prerendered with its own title and Open Graph tags", async ({
  request,
}) => {
  const html = await (await request.get("/")).text();
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  expect(title).toBeTruthy();
  expect(html).toContain(`<meta property="og:title" content="${title}"/>`);
  expect(html).toContain('<link rel="canonical"');
  // The content is in the HTML before JavaScript runs.
  expect(html).toContain("Four platforms, one foundation");
});

for (const width of [375, 768, 1440]) {
  test.describe(`home at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("shows every section without horizontal scroll", async ({ page }) => {
      await page.goto("/");
      for (const name of sections) {
        await expect(page.getByRole("region", { name })).toBeAttached();
      }
      await expect(
        page
          .getByRole("region", { name: "Four platforms, one foundation" })
          .getByRole("article"),
      ).toHaveCount(4);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("has no axe violations in either theme", async ({ page }) => {
      for (const theme of ["light", "dark"]) {
        await page.emulateMedia({
          colorScheme: theme as "light" | "dark",
        });
        await page.goto("/");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations, theme).toEqual([]);
      }
    });
  });
}

test("hero actions jump to their sections", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get in touch" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole("region", { name: "Get in touch" }),
  ).toBeInViewport();
});

test("a selected work card opens its case study", async ({ page }) => {
  await page.goto("/");
  const work = page.getByRole("region", {
    name: "Four platforms, one foundation",
  });
  const link = work.getByRole("link").first();
  const name = await link.textContent();
  await link.click();
  await expect(page).toHaveURL(/\/work\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name ?? "");
});
