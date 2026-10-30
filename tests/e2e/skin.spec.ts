import { expect, test, type Page } from "@playwright/test";

// The skin mechanism (T-041): `?skin=`, the stored choice and the default
// are applied by the pre-paint script, before the first paint.

type Frame = { skin: string; accent: string };

// Records the skin and the accent token at the first animation frame, which
// runs before the first paint.
async function recordFirstFrame(page: Page) {
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      const root = document.documentElement;
      (window as unknown as { __firstFrame: Frame }).__firstFrame = {
        skin: root.dataset.skin ?? "",
        accent: getComputedStyle(root).getPropertyValue("--accent").trim(),
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

async function settledAccent(page: Page) {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim(),
  );
}

const storedSkin = (page: Page) =>
  page.evaluate(() => localStorage.getItem("skin"));

test("the default skin is editorial", async ({ page }) => {
  await recordFirstFrame(page);
  await page.goto("/");
  expect((await firstFrame(page)).skin).toBe("editorial");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "editorial");
});

test("?skin= applies before the first paint and is remembered", async ({
  page,
}) => {
  await recordFirstFrame(page);
  await page.goto("/about?skin=systems");
  const frame = await firstFrame(page);
  expect(frame.skin).toBe("systems");
  expect(frame.accent).toBe(await settledAccent(page));
  // Hydration keeps the attribute the script set.
  await expect(page.getByRole("button", { name: "Dark theme" })).toBeEnabled();
  await expect(page.locator("html")).toHaveAttribute("data-skin", "systems");
  expect(await storedSkin(page)).toBe("systems");

  await page.goto("/work");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "systems");
});

test("a stored skin survives a reload with no flash", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("skin", "systems");
      sessionStorage.setItem("seeded", "1");
    }
  });
  await recordFirstFrame(page);
  await page.goto("/");
  expect((await firstFrame(page)).skin).toBe("systems");

  await page.reload();
  const frame = await firstFrame(page);
  expect(frame.skin).toBe("systems");
  expect(frame.accent).toBe(await settledAccent(page));
});

test("the parameter can switch back, and an unknown one is ignored", async ({
  page,
}) => {
  await page.goto("/?skin=systems");
  await page.goto("/?skin=brutalist");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "systems");
  await page.goto("/?skin=editorial");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "editorial");
  expect(await storedSkin(page)).toBe("editorial");
});

test("blocked storage still honours the parameter", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/?skin=systems");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "systems");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-skin", "editorial");
  expect(errors).toEqual([]);
});
