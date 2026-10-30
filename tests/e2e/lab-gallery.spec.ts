import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { contrast } from "../unit/helpers/contrast";

// The lab's component gallery (T-053): every primitive's variants and
// states in a light and a dark panel, and the accent-colored primitives once
// per accent in each panel. The rest of the gallery follows the page accent.

const accents = ["green", "purple", "gold", "red", "blue", "orange"] as const;
const themes = ["light", "dark"] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const gallery = (page: Page) => page.locator("#component-gallery");

// Waits for hydration: the palette's radios are disabled until then.
async function ready(page: Page) {
  await expect(page.locator('input[name="accent"]').first()).toBeEnabled();
}

function readTokens(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const read = (name: string) => style.getPropertyValue(`--${name}`).trim();
      return {
        accentName: element.getAttribute("data-accent"),
        accent: read("accent"),
        accentFg: read("accent-fg"),
        surface: read("surface"),
        raised: read("surface-raised"),
      };
    }),
  );
}

test("the gallery is in the prerendered page", async ({ request }) => {
  const html = await (await request.get("/lab")).text();
  expect(html).toContain('id="component-gallery"');
  expect(html).toContain('data-theme="light"');
  expect(html).toContain('data-theme="dark"');
  for (const accent of accents) {
    expect(html).toContain(`data-accent="${accent}"`);
  }
});

for (const theme of themes) {
  test.describe(`${theme} page`, () => {
    test.use({ colorScheme: theme });

    for (const accent of accents) {
      test(`${accent} accent: panels follow it and pass axe`, async ({
        page,
      }) => {
        await page.goto(`/lab?accent=${accent}`);
        await ready(page);
        await expect(gallery(page)).toBeVisible();
        for (const panel of themes) {
          // The panel outside its accent rows uses the page accent: the same
          // value as its own row for that accent.
          const [own] = await readTokens(
            page,
            `#component-gallery section[data-theme="${panel}"]`,
          );
          const [row] = await readTokens(
            page,
            `#component-gallery [role="group"][data-theme="${panel}"][data-accent="${accent}"]`,
          );
          expect(own.accent).toBe(row.accent);
        }
        const results = await new AxeBuilder({ page })
          .include("#component-gallery")
          .withTags(axeTags)
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test("each accent row resolves its own accent with AA contrast", async ({
      page,
    }) => {
      await page.goto("/lab");
      const values: Record<string, string[]> = {};
      for (const panel of themes) {
        const rows = await readTokens(
          page,
          `#component-gallery [role="group"][data-theme="${panel}"][data-accent]`,
        );
        expect(rows.map((row) => row.accentName)).toEqual([...accents]);
        for (const row of rows) {
          const label = `${panel} ${row.accentName}`;
          for (const background of [row.surface, row.raised]) {
            expect(contrast(row.accent, background), label).toBeGreaterThan(
              4.5,
            );
          }
          expect(contrast(row.accentFg, row.accent), label).toBeGreaterThan(
            4.5,
          );
        }
        values[panel] = rows.map((row) => row.accent);
        expect(new Set(values[panel]).size).toBe(accents.length);
      }
      // Light and dark use different values of each accent.
      values.light.forEach((value, index) =>
        expect(value).not.toBe(values.dark[index]),
      );
    });
  });
}

for (const width of [375, 768, 1440]) {
  test(`the gallery fits at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/lab");
    await ready(page);
    const fit = await page.evaluate(() => {
      const box = document
        .querySelector("#component-gallery")
        ?.getBoundingClientRect();
      return {
        scroll: document.documentElement.scrollWidth,
        right: box?.right ?? Infinity,
      };
    });
    expect(fit.scroll).toBeLessThanOrEqual(width);
    expect(fit.right).toBeLessThanOrEqual(width);
  });
}

test("the samples are live and keyboard reachable", async ({ page }) => {
  await page.goto("/lab");
  await ready(page);
  const light = gallery(page).locator('section[data-theme="light"]');

  const chip = light.getByRole("checkbox", { name: "Draft" });
  await chip.focus();
  await page.keyboard.press("Space");
  await expect(chip).toBeChecked();

  const title = light.getByRole("textbox", { name: "Title" });
  await title.focus();
  await page.keyboard.press("Tab");
  await expect(
    light.getByRole("textbox", { name: "Budget (USD)" }),
  ).toBeFocused();

  // Disabled samples are skipped.
  await light.getByRole("textbox", { name: "Quantity" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    light.getByRole("textbox", { name: "Reference" }),
  ).not.toBeFocused();
  await expect(light.getByRole("checkbox", { name: "Draft" })).toBeFocused();
});
