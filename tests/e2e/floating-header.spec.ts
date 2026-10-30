import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { site } from "../../content/site";

// Floating header (T-048, D-042): a rounded, raised bar inset from the edges
// with a gap above it, in view on every page while it scrolls, without
// hiding anchor or focus targets and without moving the layout.

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

const bar = (page: Page) => page.getByRole("banner").locator("> div > div");

// The controls are disabled until hydration, when the bar height is
// published for scroll-padding-top.
async function hydrated(page: Page) {
  await expect(
    page.getByRole("banner").getByRole("button", { name: site.themeToggle }),
  ).toBeEnabled();
}

async function barBox(page: Page) {
  const box = await bar(page).boundingBox();
  if (!box) throw new Error("The header bar has no box");
  return box;
}

for (const theme of themes) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const width of widths) {
      test(`the header floats and stays in view at ${width} px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        for (const route of routes) {
          await page.goto(route);
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            theme,
          );
          await hydrated(page);

          const style = await bar(page).evaluate((el) => {
            const css = getComputedStyle(el);
            return {
              radius: parseFloat(css.borderTopLeftRadius),
              shadow: css.boxShadow,
            };
          });
          expect(style.radius, route).toBeGreaterThan(0);
          expect(style.shadow, route).not.toBe("none");

          // Inset from the edges, with a gap at the top.
          const top = await barBox(page);
          expect(top.y, route).toBeGreaterThan(0);
          expect(top.x, route).toBeGreaterThan(0);
          expect(top.x + top.width, route).toBeLessThan(width);

          // Still in the same place at the bottom of the page.
          await page.evaluate(() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "instant",
            }),
          );
          await expect(bar(page)).toBeInViewport();
          const bottom = await barBox(page);
          expect(bottom.y, route).toBeCloseTo(top.y, 0);

          // Its controls stay usable while the page is scrolled.
          await page
            .getByRole("banner")
            .getByRole("link", { name: "About", exact: true })
            .click({ trial: true });
        }
      });
    }
  });
}

test.describe("targets stay clear of the header", () => {
  for (const width of [375, 1440]) {
    test(`anchor targets land below the bar at ${width} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await hydrated(page);
      for (const id of ["work", "contact"]) {
        await page.evaluate((hash) => {
          window.location.hash = hash;
        }, id);
        await expect
          .poll(
            async () => {
              const target = await page.locator(`#${id}`).boundingBox();
              const header = await barBox(page);
              return (target?.y ?? 0) - (header.y + header.height);
            },
            { message: `#${id}` },
          )
          .toBeGreaterThanOrEqual(0);
      }
    });

    test(`focused elements scroll out from under the bar at ${width} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/work");
      await hydrated(page);
      await page.evaluate(() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        }),
      );
      // Walk backwards from the footer through main: every focused element
      // inside main is shown below the bar, not under it.
      await page.getByRole("contentinfo").getByRole("link").first().focus();
      for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press("Shift+Tab");
        const inMain = await page.evaluate(
          () => !!document.activeElement?.closest("main"),
        );
        if (!inMain) break;
        const focused = await page.evaluate(() => {
          const rect = document.activeElement?.getBoundingClientRect();
          return { top: rect?.top ?? 0, height: rect?.height ?? 0 };
        });
        if (focused.height === 0) continue;
        const header = await barBox(page);
        expect(focused.top).toBeGreaterThanOrEqual(header.y + header.height);
      }
    });
  }
});

test("the published bar height matches the bar", async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await hydrated(page);
    await expect
      .poll(async () => {
        const header = await barBox(page);
        const offset = await page.evaluate(() =>
          parseFloat(
            document.documentElement.style.getPropertyValue("--header-height"),
          ),
        );
        return Math.abs(offset - header.height);
      })
      .toBeLessThan(1);
    const padding = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
    );
    const header = await barBox(page);
    expect(padding).toBeGreaterThan(header.height);
  }
});

// The header keeps its place in the flow and its size from the first paint,
// so nothing it holds moves and nothing below it is pushed down. Other
// shifts (a 1 px font swap in a text line) stay far below the "good" CLS
// threshold of 0.1.
test("the header causes no layout shift", async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await hydrated(page);
    const shifts = await page.evaluate(
      () =>
        new Promise<{ total: number; header: number }>((resolve) => {
          const header = document.querySelector("body > header");
          const main = document.querySelector("main");
          let total = 0;
          let fromHeader = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as unknown as {
                value: number;
                sources: { node: Node | null }[];
              };
              total += shift.value;
              if (
                shift.sources.some(
                  ({ node }) =>
                    !!node && (node === main || !!header?.contains(node)),
                )
              ) {
                fromHeader += 1;
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve({ total, header: fromHeader }), 300);
        }),
    );
    expect(shifts.header, `${width} px`).toBe(0);
    expect(shifts.total, `${width} px`).toBeLessThan(0.01);
  }
});

test("the skip link shows above the header and moves focus to main", async ({
  page,
}) => {
  await page.goto("/work");
  await hydrated(page);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  // Nothing covers the skip link: the element at its centre is the link.
  const onTop = await skipLink.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      ) === el
    );
  });
  expect(onTop).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});
