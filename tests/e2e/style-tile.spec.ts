import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("style tile", () => {
  test("shows both themes and is not indexed", async ({ page }) => {
    const response = await page.goto("/style-tile");
    expect(response?.status()).toBe(200);
    await expect(page.locator('section[data-theme="light"]')).toBeVisible();
    await expect(page.locator('section[data-theme="dark"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
  });

  test("loads only the Geist fonts", async ({ page }) => {
    await page.goto("/style-tile");
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((face) => face.status === "loaded")
        .map((face) => face.family.replaceAll('"', ""));
    });
    expect(new Set(loaded)).toEqual(
      new Set(["Geist Variable", "Geist Mono Variable"]),
    );
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`has no axe violations with a ${colorScheme} system theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/style-tile");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test("work row shows its focus ring on the whole card", async ({ page }) => {
  await page.goto("/style-tile");
  const link = page
    .locator('section[data-theme="light"]')
    .getByRole("link", { name: "Airline crew management platform" });
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  const outline = await link
    .locator("xpath=ancestor::article")
    .evaluate((card) => getComputedStyle(card).outlineStyle);
  expect(outline).toBe("solid");
});
