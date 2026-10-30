import { expect, test, type Page } from "@playwright/test";

// The skin switcher (T-042). playwright.config.ts runs this file in
// Chromium, Firefox and WebKit.

const switcher = (page: Page) =>
  page.getByRole("button", { name: "Switch design" });

const html = (page: Page) => page.locator("html");

// The switcher's own status region (the command palette has another one).
const status = (page: Page) =>
  page.locator('button[aria-label="Switch design"] ~ [role="status"]');

// Records, at the moment `data-skin` changes, whether the transition marker
// is set and whether every font of the new skin is already loaded.
type Change = { skin: string; marked: boolean; fontsReady: boolean };

async function recordSkinChanges(page: Page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    const fonts: Record<string, string[]> = {
      editorial: [
        '1em "Fraunces Variable"',
        '1em "Geist Variable"',
        '1em "Geist Mono Variable"',
      ],
      systems: ['1em "Geist Variable"', '1em "Geist Mono Variable"'],
    };
    const w = window as unknown as {
      __changes: Change[];
      __reveals: string[];
      __marked: boolean;
    };
    w.__changes = [];
    w.__reveals = [];
    w.__marked = false;
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "data-skin-transition") {
          if (root.hasAttribute("data-skin-transition")) w.__marked = true;
          continue;
        }
        const skin = root.dataset.skin ?? "";
        w.__changes.push({
          skin,
          marked: root.hasAttribute("data-skin-transition"),
          fontsReady: (fonts[skin] ?? []).every((font) =>
            document.fonts.check(font),
          ),
        });
      }
    }).observe(root, {
      attributes: true,
      attributeFilter: ["data-skin", "data-skin-transition"],
    });
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (typeof options === "object" && options.pseudoElement) {
        w.__reveals.push(options.pseudoElement);
      }
      return animate.call(this, keyframes, options);
    };
  });
}

function recorded(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      __changes: Change[];
      __reveals: string[];
      __marked: boolean;
    };
    return { changes: w.__changes, reveals: w.__reveals, marked: w.__marked };
  });
}

test("the switcher works from the keyboard and announces the design", async ({
  page,
}) => {
  await page.goto("/");
  await expect(switcher(page)).toBeEnabled();
  await expect(switcher(page)).toHaveAccessibleDescription(
    "Current design: Editorial",
  );

  await switcher(page).focus();
  await page.keyboard.press("Enter");
  await expect(html(page)).toHaveAttribute("data-skin", "systems");
  await expect(status(page)).toHaveText("Systems design on");
  await expect(switcher(page)).toHaveAccessibleDescription(
    "Current design: Systems",
  );
  await expect(switcher(page)).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("skin"))).toBe(
    "systems",
  );

  await page.reload();
  await expect(html(page)).toHaveAttribute("data-skin", "systems");

  await switcher(page).focus();
  await page.keyboard.press("Space");
  await expect(html(page)).toHaveAttribute("data-skin", "editorial");
  await expect(status(page)).toHaveText("Editorial design on");
});

test("the target skin's fonts are loaded before it applies, with no layout jump", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("skin", "systems"));
  await page.goto("/");
  await expect(switcher(page)).toBeEnabled();
  const before = await switcher(page).boundingBox();
  await recordSkinChanges(page);

  await switcher(page).click();
  await expect(html(page)).toHaveAttribute("data-skin", "editorial");
  await expect(html(page)).not.toHaveAttribute("data-skin-transition");

  const { changes } = await recorded(page);
  expect(changes).toHaveLength(1);
  expect(changes[0]).toMatchObject({ skin: "editorial", fontsReady: true });
  expect(await switcher(page).boundingBox()).toEqual(before);
});

test("the new skin is revealed by a circle from the switcher", async ({
  page,
}) => {
  await page.goto("/");
  const supported = await page.evaluate(
    () => typeof document.startViewTransition === "function",
  );
  test.skip(!supported, "This browser has no View Transitions");
  await expect(switcher(page)).toBeEnabled();
  await recordSkinChanges(page);

  await switcher(page).click();
  await expect(html(page)).toHaveAttribute("data-skin", "systems");
  await expect(html(page)).not.toHaveAttribute("data-skin-transition");

  const { changes, reveals } = await recorded(page);
  expect(changes[0]).toMatchObject({ skin: "systems", marked: true });
  expect(reveals).toEqual(["::view-transition-new(root)"]);
});

test("reduced motion switches instantly, without a transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(switcher(page)).toBeEnabled();
  await recordSkinChanges(page);

  await switcher(page).click();
  await expect(html(page)).toHaveAttribute("data-skin", "systems");

  const { changes, reveals, marked } = await recorded(page);
  expect(changes[0]).toMatchObject({ skin: "systems", marked: false });
  expect(marked).toBe(false);
  expect(reveals).toEqual([]);
});

test("without View Transitions the switch still applies", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Document.prototype, "startViewTransition");
  });
  await page.goto("/");
  await expect(switcher(page)).toBeEnabled();
  await recordSkinChanges(page);

  await switcher(page).click();
  await expect(html(page)).toHaveAttribute("data-skin", "systems");
  await expect(status(page)).toHaveText("Systems design on");
  expect((await recorded(page)).marked).toBe(false);
});

test("only the active skin's own fonts are preloaded", async ({ page }) => {
  const preloads = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(
        (link) => link.getAttribute("href") ?? "",
      ),
    );

  await page.goto("/");
  expect((await preloads()).some((href) => href.includes("fraunces"))).toBe(
    true,
  );

  await page.goto("/?skin=systems");
  const systems = await preloads();
  expect(systems.some((href) => href.includes("geist"))).toBe(true);
  expect(systems.some((href) => href.includes("fraunces"))).toBe(false);
});
