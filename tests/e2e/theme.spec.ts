import { expect, test, type Page } from "@playwright/test";

// Records the theme and page background at the first animation frame, which
// runs before the first paint.
async function recordFirstFrame(page: Page) {
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__firstFrame = {
        theme: document.documentElement.dataset.theme,
        background: getComputedStyle(document.documentElement).backgroundColor,
      };
    });
  });
}

async function firstFrame(page: Page) {
  await page.waitForFunction(() => "__firstFrame" in window);
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __firstFrame: { theme: string; background: string };
        }
      ).__firstFrame,
  );
}

async function settledBackground(page: Page) {
  return page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
}

const toggle = (page: Page) => page.getByRole("button", { name: "Dark theme" });

test("a dark system theme is applied before the first paint", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await recordFirstFrame(page);
  await page.goto("/");
  const frame = await firstFrame(page);
  expect(frame.theme).toBe("dark");
  expect(frame.background).toBe(await settledBackground(page));
});

test("a stored choice wins over the system theme, with no flash", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await recordFirstFrame(page);
  await page.goto("/");
  const frame = await firstFrame(page);
  expect(frame.theme).toBe("light");
  expect(frame.background).toBe(await settledBackground(page));
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("the toggle works from the keyboard and the choice survives a reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(toggle(page)).toBeEnabled();

  await toggle(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.keyboard.press("Space");

  await recordFirstFrame(page);
  await page.reload();
  expect((await firstFrame(page)).theme).toBe("dark");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
});

test("the toggle is reachable by Tab after the navigation, the CV link and the design switcher", async ({
  page,
}) => {
  await page.goto("/");
  await expect(toggle(page)).toBeEnabled();
  await page.getByRole("link", { name: "Lab", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Download CV (PDF)" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Switch design" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(toggle(page)).toBeFocused();
});

test("blocked storage falls back to the system theme and still toggles", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle(page)).toBeEnabled();
  await toggle(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`view transition use with reduced motion: ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion, colorScheme: "light" });
    await page.addInitScript(() => {
      const w = window as unknown as { __transitions: number };
      w.__transitions = 0;
      const original = document.startViewTransition?.bind(document);
      if (original) {
        document.startViewTransition = ((update: () => void) => {
          w.__transitions += 1;
          return original(update);
        }) as typeof document.startViewTransition;
      }
    });
    await page.goto("/");
    await expect(toggle(page)).toBeEnabled();
    await toggle(page).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const transitions = await page.evaluate(
      () => (window as unknown as { __transitions: number }).__transitions,
    );
    expect(transitions).toBe(reducedMotion === "reduce" ? 0 : 1);
  });
}
