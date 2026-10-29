import { readdirSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every project file must have its own prerendered page (T-020).
const slugs = readdirSync("content/projects")
  .filter((name) => name.endsWith(".mdx"))
  .map((name) => name.replace(/\.mdx$/, ""));

test.describe("case study pages", () => {
  for (const slug of slugs) {
    test(`/work/${slug} is prerendered with its own title`, async ({
      page,
      request,
    }) => {
      // The raw HTML, before JavaScript runs, already carries the page's
      // title and Open Graph tags.
      const html = await (await request.get(`/work/${slug}`)).text();
      expect(html).toContain(`/work/${slug}"`);
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
      expect(title).toBeTruthy();
      expect(html).toContain(`<meta property="og:title" content="${title}"/>`);

      const response = await page.goto(`/work/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title ?? "");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("a case study has no axe violations", async ({ page }) => {
    await page.goto(`/work/${slugs[0]}`);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
