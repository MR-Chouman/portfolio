import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The lab's page copy (T-054): how each pattern works and links to its
// source on GitHub, in the prerendered page, readable at every width and in
// both themes.

const repo = "https://github.com/MR-Chouman/portfolio/";
const notesTitles = [
  "How the table works",
  "How the drawer works",
  "How the gallery works",
];
const themes = ["light", "dark"] as const;
const widths = [375, 768, 1440];
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("the notes and source links are in the prerendered page", async ({
  request,
}) => {
  const html = await (await request.get("/lab")).text();
  for (const title of notesTitles) expect(html).toContain(title);
  expect(html).toContain(`${repo}tree/main/app/components/lab`);
});

for (const theme of themes) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const width of widths) {
      test(`explains each pattern and links to its source at ${width} px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/lab");

        const intro = page.getByRole("link", {
          name: "Browse the lab's source on GitHub",
        });
        await expect(intro).toHaveAttribute("href", new RegExp(`^${repo}`));

        for (const title of notesTitles) {
          const region = page.getByRole("region", { name: title });
          await region.scrollIntoViewIfNeeded();
          await expect(region).toBeVisible();
          const links = region
            .getByRole("list", { name: "Source on GitHub" })
            .getByRole("link");
          expect(await links.count()).toBeGreaterThan(0);
          for (const href of await links.evaluateAll((all) =>
            all.map((link) => link.getAttribute("href") ?? ""),
          )) {
            expect(href.startsWith(repo)).toBe(true);
          }
        }

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);

        const results = await new AxeBuilder({ page })
          .withTags(axeTags)
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test("the source links are reachable with the keyboard", async ({ page }) => {
  await page.goto("/lab");
  const link = page
    .getByRole("region", { name: "How the gallery works" })
    .getByRole("link")
    .first();
  await link.focus();
  await expect(link).toBeFocused();
});
