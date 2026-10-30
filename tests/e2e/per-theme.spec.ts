import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { contrast } from "../unit/helpers/contrast";

// Per-theme QA (T-044, T-045): every page in both themes, loaded the way a
// visitor gets it, with the theme from the system color scheme. Each test
// runs in a fresh browser context, so no stored choice leaks between themes.

const slugs = readdirSync(join(process.cwd(), "content", "projects"))
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => file.replace(/\.mdx$/, ""))
  .sort();

const routes = [
  "/",
  "/work",
  ...slugs.map((slug) => `/work/${slug}`),
  "/about",
  "/style-tile",
  "/not-a-page",
];

const themes = ["light", "dark"] as const;
const widths = [375, 768, 1440];
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectTheme(page: Page, theme: string) {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

for (const theme of themes) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const route of routes) {
      test(`${route} loads and has no axe violations`, async ({ page }) => {
        const response = await page.goto(route);
        // sirv serves the 404 page with a 200 status (see not-found.spec).
        expect(response?.status()).toBe(200);
        await expectTheme(page, theme);
        await expect(page).toHaveTitle(/.+/);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.getByRole("contentinfo")).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(axeTags)
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }

    // tokens.css is checked in unit tests; this checks the values the
    // browser actually resolves on the page, after the whole cascade.
    test("the resolved color tokens meet WCAG AA contrast", async ({
      page,
    }) => {
      await page.goto("/");
      await expectTheme(page, theme);
      const tokens = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const read = (name: string) =>
          style.getPropertyValue(`--${name}`).trim();
        return {
          surface: read("surface"),
          raised: read("surface-raised"),
          fg: read("fg"),
          muted: read("fg-muted"),
          accent: read("accent"),
          accentFg: read("accent-fg"),
          focus: read("focus"),
        };
      });

      for (const background of [tokens.surface, tokens.raised]) {
        expect(contrast(tokens.fg, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens.muted, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens.accent, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens.focus, background)).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(tokens.accentFg, tokens.accent)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    for (const width of widths) {
      test(`no page scrolls sideways at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const route of routes) {
          await page.goto(route);
          await expectTheme(page, theme);
          const layout = await page.evaluate(() => {
            const header = document.querySelector("header");
            const h1 = document.querySelector("h1");
            return {
              overflow:
                document.documentElement.scrollWidth - window.innerWidth,
              headerRight: header?.getBoundingClientRect().right ?? 0,
              h1Right: h1?.getBoundingClientRect().right ?? 0,
            };
          });
          expect(layout.overflow, route).toBeLessThanOrEqual(0);
          expect(layout.headerRight, route).toBeLessThanOrEqual(width);
          expect(layout.h1Right, route).toBeLessThanOrEqual(width);
        }
      });
    }
  });
}

// One design (D-038): the built site has no skin layer and no Editorial
// font left, in the page, its scripts or its styles.
test("the build ships one design, with no skin layer or Fraunces", () => {
  const client = join(process.cwd(), "build", "client");
  const files = [
    "index.html",
    ...readdirSync(join(client, "assets"))
      .filter((file) => /\.(css|js)$/.test(file))
      .map((file) => join("assets", file)),
  ];
  const offenders = files.filter((file) =>
    /data-skin|dataset\.skin|fraunces/i.test(
      readFileSync(join(client, file), "utf8"),
    ),
  );
  expect(offenders).toEqual([]);
  expect(
    readdirSync(join(client, "assets")).filter((file) =>
      /fraunces/i.test(file),
    ),
  ).toEqual([]);
});

test("the page uses the Geist fonts and the console radii", async ({
  page,
}) => {
  await page.goto("/");
  const design = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const h1 = document.querySelector("h1");
    return {
      radius: root.getPropertyValue("--radius-card").trim(),
      heading: h1 ? getComputedStyle(h1).fontFamily : "",
      body: getComputedStyle(document.body).fontFamily,
      grid: root.backgroundImage,
    };
  });
  expect(design.radius).toBe("6px");
  expect(design.heading).toMatch(/^"?Geist Variable/);
  expect(design.body).toMatch(/^"?Geist Variable/);
  expect(design.grid).toContain("linear-gradient");
});

test("a dark section keeps the dark theme on a light page", async ({
  page,
}) => {
  const rootSurface = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface")
        .trim(),
    );
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/style-tile");
  const surfaces = await page.evaluate(() =>
    ["light", "dark"].map((theme) => {
      const section = document.querySelector(`section[data-theme="${theme}"]`);
      return section
        ? getComputedStyle(section).getPropertyValue("--surface").trim()
        : "";
    }),
  );
  const light = await rootSurface();
  expect(surfaces[0]).toBe(light);
  expect(surfaces[1]).not.toBe(light);

  // The dark section matches the page in the dark theme.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  expect(surfaces[1]).toBe(await rootSurface());
});
