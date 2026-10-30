import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Systems skin (T-040) on every page, in both themes. The skin is set on
// <html> directly until the skin mechanism (T-041) adds `?skin=`; T-044 moves
// these checks onto the parameter.
const routes = [
  "/",
  "/work",
  "/work/airline-crew-management",
  "/about",
  "/style-tile",
  "/not-a-page",
];

async function applySkin(page: Page, theme: "light" | "dark") {
  await page.evaluate((value) => {
    document.documentElement.dataset.skin = "systems";
    document.documentElement.dataset.theme = value;
  }, theme);
}

for (const theme of ["light", "dark"] as const) {
  for (const route of routes) {
    test(`${route} in the systems skin, ${theme} theme, has no axe violations`, async ({
      page,
    }) => {
      await page.goto(route);
      await applySkin(page, theme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test("the systems skin changes tokens, fonts and radii", async ({ page }) => {
  await page.goto("/");
  const read = () =>
    page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const h1 = document.querySelector("h1");
      return {
        surface: root.getPropertyValue("--surface").trim(),
        accent: root.getPropertyValue("--accent").trim(),
        radius: root.getPropertyValue("--radius-card").trim(),
        heading: h1 ? getComputedStyle(h1).fontFamily : "",
      };
    });
  const editorial = await read();
  await applySkin(page, "light");
  const systems = await read();

  expect(systems.surface).not.toBe(editorial.surface);
  expect(systems.accent).not.toBe(editorial.accent);
  expect(systems.radius).toBe("6px");
  expect(editorial.heading).toMatch(/^"?Fraunces/);
  expect(systems.heading).toMatch(/^"?Geist Variable/);
});

test("the systems skin keeps its dark theme inside a dark section", async ({
  page,
}) => {
  await page.goto("/style-tile");
  await applySkin(page, "light");
  const surfaces = await page.evaluate(() =>
    ["light", "dark"].map((theme) => {
      const section = document.querySelector(`section[data-theme="${theme}"]`);
      return section
        ? getComputedStyle(section).getPropertyValue("--surface").trim()
        : "";
    }),
  );
  const root = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--surface")
      .trim(),
  );
  expect(surfaces[0]).toBe(root);
  expect(surfaces[1]).not.toBe(root);

  // The dark section matches the page in the systems dark theme.
  await applySkin(page, "dark");
  const dark = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--surface")
      .trim(),
  );
  expect(surfaces[1]).toBe(dark);
});

test("no page scrolls sideways at 375 px in the systems skin", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const route of routes) {
    await page.goto(route);
    await applySkin(page, "light");
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(width, route).toBeLessThanOrEqual(375);
  }
});
