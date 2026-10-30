import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { contrast } from "../unit/helpers/contrast";

// Per-skin QA (T-044): every page in every skin and theme, loaded the way a
// visitor gets it, through `?skin=` (D-034) and the system color scheme.
// Each test runs in a fresh browser context, so no stored choice leaks
// between skins.

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

// Mirrors SKINS in app/lib/skin.ts, which Playwright cannot import (it pulls
// a font file through Vite's `?url`); the test right below fails if the two
// drift apart.
const skins = ["editorial", "systems"] as const;
const themes = ["light", "dark"] as const;
const widths = [375, 768, 1440];
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("the QA matrix covers every skin the site ships", () => {
  // The pre-paint script in the built page lists the valid skins.
  const html = readFileSync(
    join(process.cwd(), "build", "client", "index.html"),
    "utf8",
  );
  const listed = /v=(\[[^\]]*\])/.exec(html)?.[1];
  expect(listed && JSON.parse(listed)).toEqual([...skins]);
});

function withSkin(route: string, skin: string) {
  return `${route}?skin=${skin}`;
}

async function expectSkinAndTheme(page: Page, skin: string, theme: string) {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-skin", skin);
  await expect(html).toHaveAttribute("data-theme", theme);
}

for (const skin of skins) {
  for (const theme of themes) {
    test.describe(`${skin} skin, ${theme} theme`, () => {
      test.use({ colorScheme: theme });

      for (const route of routes) {
        test(`${route} loads and has no axe violations`, async ({ page }) => {
          const response = await page.goto(withSkin(route, skin));
          // sirv serves the 404 page with a 200 status (see not-found.spec).
          expect(response?.status()).toBe(200);
          await expectSkinAndTheme(page, skin, theme);
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

      // The skin files are checked in unit tests; this checks the values the
      // browser actually resolves on the page, after the whole cascade.
      test("the resolved color tokens meet WCAG AA contrast", async ({
        page,
      }) => {
        await page.goto(withSkin("/", skin));
        await expectSkinAndTheme(page, skin, theme);
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
          expect(contrast(tokens.muted, background)).toBeGreaterThanOrEqual(
            4.5,
          );
          expect(contrast(tokens.accent, background)).toBeGreaterThanOrEqual(
            4.5,
          );
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
            await page.goto(withSkin(route, skin));
            await expectSkinAndTheme(page, skin, theme);
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
}

test("the skins differ in tokens, fonts and radii", async ({ page }) => {
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
  await page.goto(withSkin("/", "editorial"));
  const editorial = await read();
  await page.goto(withSkin("/", "systems"));
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
  const rootSurface = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface")
        .trim(),
    );
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(withSkin("/style-tile", "systems"));
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

  // The dark section matches the page in the systems dark theme.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  expect(surfaces[1]).toBe(await rootSurface());
});
