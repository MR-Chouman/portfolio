import { expect, test, type Page } from "@playwright/test";

import { contrast } from "../unit/helpers/contrast";

// Accent colors (T-046): `data-accent` and the accent token are right at the
// first frame, the `?accent=` parameter applies and is stored, and the
// command palette switches the accent. The floating palette and the full
// per-accent QA come in T-047 and T-049.

const accents = ["green", "purple", "gold", "red", "blue", "orange"] as const;

interface Frame {
  accent: string | undefined;
  color: string;
}

// Records the accent and its token at the first animation frame, which runs
// before the first paint.
async function recordFirstFrame(page: Page) {
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      (window as unknown as { __firstFrame: Frame }).__firstFrame = {
        accent: document.documentElement.dataset.accent,
        color: getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      };
    });
  });
}

async function firstFrame(page: Page): Promise<Frame> {
  await page.waitForFunction(() => "__firstFrame" in window);
  return page.evaluate(
    () => (window as unknown as { __firstFrame: Frame }).__firstFrame,
  );
}

async function settledAccent(page: Page): Promise<Frame> {
  return page.evaluate(() => ({
    accent: document.documentElement.dataset.accent,
    color: getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim(),
  }));
}

test("green is the default accent", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "green");
});

test("the parameter applies before the first paint and is stored", async ({
  page,
}) => {
  await recordFirstFrame(page);
  await page.goto("/?accent=purple");
  const first = await firstFrame(page);
  expect(first.accent).toBe("purple");
  expect(first).toEqual(await settledAccent(page));
  expect(await page.evaluate(() => localStorage.getItem("accent"))).toBe(
    "purple",
  );

  // A reload without the parameter keeps it, with no flash of green.
  await page.goto("/about");
  const reloaded = await firstFrame(page);
  expect(reloaded).toEqual(first);
});

test("an unknown parameter is ignored", async ({ page }) => {
  await page.goto("/?accent=pink");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "green");
  expect(await page.evaluate(() => localStorage.getItem("accent"))).toBeNull();
});

for (const theme of ["light", "dark"] as const) {
  test(`every accent resolves to its own AA color in the ${theme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const colors = new Set<string>();
    for (const accent of accents) {
      await page.goto(`/?accent=${accent}`);
      await expect(page.locator("html")).toHaveAttribute("data-accent", accent);
      const tokens = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const read = (name: string) =>
          style.getPropertyValue(`--${name}`).trim();
        return {
          surface: read("surface"),
          raised: read("surface-raised"),
          accent: read("accent"),
          accentFg: read("accent-fg"),
        };
      });
      colors.add(tokens.accent);
      expect(contrast(tokens.accent, tokens.surface)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(tokens.accent, tokens.raised)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(tokens.accentFg, tokens.accent)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    expect(colors.size).toBe(accents.length);
  });
}

test("the command palette switches the accent and it survives a reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open command palette" }),
  ).toBeEnabled();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("combobox", { name: "Search commands" }),
  ).toBeFocused();
  await expect(page.getByRole("option", { name: /accent$/ })).toHaveCount(6);
  await page.keyboard.type("gold accent");
  await page.keyboard.press("Enter");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-accent", "gold");
  await expect(
    page.getByRole("status").filter({ hasText: "Gold accent on" }),
  ).toHaveCount(1);

  await recordFirstFrame(page);
  await page.reload();
  expect((await firstFrame(page)).accent).toBe("gold");
});
