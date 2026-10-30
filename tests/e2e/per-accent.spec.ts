import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { contrast } from "../unit/helpers/contrast";

// Accent and header QA (T-049): every page in every accent and both themes,
// loaded the way a visitor gets it (`?accent=`, theme from the system color
// scheme, a fresh browser context per test). Smoke and axe per page, WCAG AA
// contrast on the tokens the browser resolves, and the layout with the
// floating header and accent palette at 375, 768 and 1440 px.

// Playwright cannot import app/lib/accent.ts through Vite; a test below
// keeps this list in step with the built pre-paint script.
const accents = ["green", "purple", "gold", "red", "blue", "orange"] as const;
const names = ["Green", "Purple", "Gold", "Red", "Blue", "Orange"];

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

async function expectLook(page: Page, theme: string, accent: string) {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", theme);
  await expect(html).toHaveAttribute("data-accent", accent);
}

// Waits for hydration: the palette's radios are disabled until then.
async function ready(page: Page) {
  await expect(page.locator('input[name="accent"]').first()).toBeEnabled();
}

// Resolved color tokens of an element, after the whole cascade.
function readTokens(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`no ${selector}`);
    const style = getComputedStyle(element);
    const read = (name: string) => style.getPropertyValue(`--${name}`).trim();
    return {
      surface: read("surface"),
      raised: read("surface-raised"),
      fg: read("fg"),
      muted: read("fg-muted"),
      accent: read("accent"),
      accentFg: read("accent-fg"),
      focus: read("focus"),
    };
  }, selector);
}

type Tokens = Awaited<ReturnType<typeof readTokens>>;

function expectAA(tokens: Tokens, label: string) {
  for (const background of [tokens.surface, tokens.raised]) {
    expect(contrast(tokens.fg, background), label).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.muted, background), label).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast(tokens.accent, background), label).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(contrast(tokens.focus, background), label).toBeGreaterThanOrEqual(3);
  }
  expect(
    contrast(tokens.accentFg, tokens.accent),
    label,
  ).toBeGreaterThanOrEqual(4.5);
}

test("the accent list matches the built pre-paint script", () => {
  const html = readFileSync(
    join(process.cwd(), "build", "client", "index.html"),
    "utf8",
  );
  const match = /\[(?:"[a-z]+",)*"green"(?:,"[a-z]+")*\]/.exec(html);
  expect(match, "no accent list in the built page").not.toBeNull();
  expect(JSON.parse(match?.[0] ?? "[]")).toEqual([...accents]);
});

for (const theme of themes) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    accents.forEach((accent, index) => {
      test.describe(`${accent} accent`, () => {
        for (const route of routes) {
          test(`${route} loads and has no axe violations`, async ({ page }) => {
            const response = await page.goto(`${route}?accent=${accent}`);
            // sirv serves the 404 page with a 200 status (see not-found.spec).
            expect(response?.status()).toBe(200);
            await expectLook(page, theme, accent);
            await ready(page);
            await expect(page).toHaveTitle(/.+/);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            await expect(page.getByRole("banner")).toBeVisible();
            await expect(page.getByRole("contentinfo")).toBeVisible();
            await expect(
              page
                .getByRole("radiogroup", { name: "Accent color" })
                .getByRole("radio", { name: names[index] }),
            ).toBeChecked();

            const results = await new AxeBuilder({ page })
              .withTags(axeTags)
              .analyze();
            expect(results.violations).toEqual([]);
          });
        }

        // The page's tokens, and those of the light and dark sections of the
        // style tile, which keep the page's accent in their own theme.
        test("the resolved color tokens meet WCAG AA contrast", async ({
          page,
        }) => {
          await page.goto(`/style-tile?accent=${accent}`);
          await expectLook(page, theme, accent);
          expectAA(await readTokens(page, "html"), "page");
          for (const section of themes) {
            const tokens = await readTokens(
              page,
              `section[data-theme="${section}"]`,
            );
            expectAA(tokens, `${section} section`);
          }
        });

        for (const width of widths) {
          test(`header and palette fit every page at ${width} px`, async ({
            page,
          }) => {
            await page.setViewportSize({ width, height: 800 });
            for (const route of routes) {
              await page.goto(`${route}?accent=${accent}`);
              await expectLook(page, theme, accent);
              await ready(page);
              const layout = await page.evaluate(() => {
                const bar = document.querySelector("header > div > div");
                const h1 = document.querySelector("h1");
                const palette = [
                  ...document.querySelectorAll<HTMLElement>(
                    '[role="radiogroup"], button[aria-controls]',
                  ),
                ].filter((element) => element.offsetParent !== null);
                const contentLeft = Math.min(
                  ...[
                    ...document.querySelectorAll<HTMLElement>(
                      ".page-container",
                    ),
                  ].map(
                    (element) =>
                      element.getBoundingClientRect().left +
                      parseFloat(getComputedStyle(element).paddingLeft),
                  ),
                );
                const box = (element: Element | null | undefined) => {
                  const rect = element?.getBoundingClientRect();
                  return {
                    top: rect?.top ?? 0,
                    left: rect?.left ?? 0,
                    right: rect?.right ?? 0,
                    bottom: rect?.bottom ?? 0,
                  };
                };
                return {
                  overflow:
                    document.documentElement.scrollWidth - window.innerWidth,
                  bar: box(bar),
                  h1: box(h1),
                  palette: box(palette[0]),
                  paletteCount: palette.length,
                  contentLeft,
                };
              });
              expect(layout.overflow, route).toBeLessThanOrEqual(0);
              // The header bar floats inside the viewport.
              expect(layout.bar.top, route).toBeGreaterThan(0);
              expect(layout.bar.left, route).toBeGreaterThan(0);
              expect(layout.bar.right, route).toBeLessThan(width);
              expect(layout.h1.right, route).toBeLessThanOrEqual(width);
              // One palette control, clear of the content and of the bar.
              expect(layout.paletteCount, route).toBe(1);
              expect(layout.palette.right, route).toBeLessThanOrEqual(
                layout.contentLeft,
              );
              expect(layout.palette.top, route).toBeGreaterThanOrEqual(
                layout.bar.bottom,
              );
            }
          });
        }
      });
    });
  });
}
