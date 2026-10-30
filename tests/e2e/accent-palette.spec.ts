import { readdirSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The floating accent palette (T-047): fixed to the left, a rail of six
// swatches from tablet width up, a tab that opens them on phones; a
// labelled radio group that works with the keyboard and never covers page
// content.

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
  "/lab",
  "/style-tile",
  "/not-a-page",
];

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function group(page: Page) {
  return page.getByRole("radiogroup", { name: "Accent color" });
}

function tab(page: Page) {
  return page.getByRole("button", { name: /^Accent color/ });
}

// Waits for hydration: the controls are disabled until the accent is known.
async function ready(page: Page) {
  await expect(page.locator('input[name="accent"]').first()).not.toBeDisabled();
}

// The right edge of the visible palette and the left edge of the content of
// every page-container (header, page, footer).
async function edges(page: Page) {
  return page.evaluate(() => {
    const visible = [
      ...document.querySelectorAll<HTMLElement>(
        '[role="radiogroup"], button[aria-controls]',
      ),
    ].filter((element) => element.offsetParent !== null);
    const paletteRight = Math.max(
      ...visible.map((element) => element.getBoundingClientRect().right),
    );
    const contentLeft = Math.min(
      ...[...document.querySelectorAll<HTMLElement>(".page-container")].map(
        (element) =>
          element.getBoundingClientRect().left +
          parseFloat(getComputedStyle(element).paddingLeft),
      ),
    );
    return { paletteRight, contentLeft, count: visible.length };
  });
}

for (const width of [375, 768, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const route of routes) {
      test(`${route}: the palette never covers content`, async ({ page }) => {
        await page.goto(route);
        await ready(page);
        const { paletteRight, contentLeft, count } = await edges(page);
        expect(count).toBe(1);
        expect(paletteRight).toBeLessThanOrEqual(contentLeft);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }

    test("shows the right control, vertically centred", async ({ page }) => {
      await page.goto("/");
      await ready(page);
      const control = width < 768 ? tab(page) : group(page);
      await expect(control).toBeVisible();
      if (width < 768) {
        await expect(group(page)).toBeHidden();
      } else {
        await expect(tab(page)).toBeHidden();
        await expect(group(page).getByRole("radio")).toHaveCount(6);
      }
      const box = await control.boundingBox();
      if (!box) throw new Error("the palette has no box");
      const centre = box.y + box.height / 2;
      expect(Math.abs(centre - 400)).toBeLessThanOrEqual(1);
      // It stays in place while the page scrolls.
      await page.mouse.wheel(0, 600);
      await expect
        .poll(async () => (await control.boundingBox())?.y)
        .toBeCloseTo(box.y, 0);
    });
  });
}

test.describe("on phones", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("the tab opens the six swatches; Escape closes them", async ({
    page,
  }) => {
    await page.goto("/");
    await ready(page);
    await expect(tab(page)).toHaveAccessibleName("Accent color: Green");
    await expect(tab(page)).toHaveAttribute("aria-expanded", "false");

    await tab(page).click();
    await expect(tab(page)).toHaveAttribute("aria-expanded", "true");
    await expect(group(page)).toBeVisible();
    await expect(group(page).getByRole("radio")).toHaveCount(6);

    await page.locator('label[data-accent="gold"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "gold");
    await expect(tab(page)).toHaveAccessibleName("Accent color: Gold");
    await expect(
      page.getByRole("status").filter({ hasText: "Gold" }),
    ).toHaveText("Gold accent on");

    await page.keyboard.press("Escape");
    await expect(group(page)).toBeHidden();
    await expect(tab(page)).toBeFocused();
  });

  test("a tap outside closes the swatches", async ({ page }) => {
    await page.goto("/");
    await ready(page);
    await tab(page).click();
    await expect(group(page)).toBeVisible();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(group(page)).toBeHidden();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`open swatches have no axe violations (${theme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/");
      await ready(page);
      await tab(page).click();
      await expect(group(page)).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(axeTags)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("from tablet width up", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("arrow keys choose an accent, with a visible focus ring", async ({
    page,
  }) => {
    await page.goto("/");
    await ready(page);
    const radios = group(page).getByRole("radio");
    await expect(radios.nth(0)).toBeChecked();

    // Tab reaches the checked swatch after the header controls.
    await page.getByRole("button", { name: "Dark theme" }).focus();
    await page.keyboard.press("Tab");
    await expect(radios.nth(0)).toBeFocused();
    const outline = await page
      .locator('label[data-accent="green"]')
      .evaluate((label) => getComputedStyle(label).outlineStyle);
    expect(outline).toBe("solid");

    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(1)).toBeFocused();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "purple");
    await expect(
      page.getByRole("status").filter({ hasText: "accent" }),
    ).toHaveText("Purple accent on");

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "green");

    // The choice is stored and checked on the next page.
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "orange");
    await page.goto("/about");
    await ready(page);
    await expect(
      group(page).getByRole("radio", { name: "Orange" }),
    ).toBeChecked();
  });

  test("each radio is named after its accent", async ({ page }) => {
    await page.goto("/");
    await ready(page);
    for (const name of names) {
      await expect(group(page).getByRole("radio", { name })).toHaveCount(1);
    }
  });

  for (const theme of ["light", "dark"] as const) {
    test(`each swatch shows its own accent (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/?accent=blue");
      await ready(page);
      const colors = await page.evaluate(
        ({ list, theme }) =>
          list.map((accent) => {
            const swatch = document.querySelector<HTMLElement>(
              `label[data-accent="${accent}"]`,
            );
            if (!swatch) throw new Error(`no ${accent} swatch`);
            const style = getComputedStyle(swatch);
            // Resolve the expected token through a probe with the same
            // computed-value form as the swatch background.
            const probe = document.createElement("span");
            probe.style.backgroundColor = style
              .getPropertyValue(`--accent-${theme}`)
              .trim();
            swatch.append(probe);
            const expected = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return { actual: style.backgroundColor, expected };
          }),
        { list: [...accents], theme },
      );
      for (const { actual, expected } of colors) {
        expect(actual).toBe(expected);
      }
      expect(new Set(colors.map(({ actual }) => actual)).size).toBe(6);
    });

    test(`the rail has no axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/");
      await ready(page);
      const results = await new AxeBuilder({ page })
        .include('[role="radiogroup"]')
        .withTags(axeTags)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
