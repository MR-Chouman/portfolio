import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The command palette (T-043): Ctrl/Cmd+K, keyboard and screen-reader use,
// lazy loading, and each kind of command.

const trigger = (page: Page) =>
  page.getByRole("button", { name: "Open command palette" });
const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" });
const input = (page: Page) =>
  page.getByRole("combobox", { name: "Search commands" });

// Waits for hydration, when the shortcut listener is attached.
async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(trigger(page)).toBeEnabled();
}

// Opens it with the shortcut and waits for the lazy chunk, so typing lands
// in the search field.
async function openPalette(page: Page) {
  await page.keyboard.press("Control+k");
  await expect(input(page)).toBeFocused();
}

test("the palette is loaded only when it is first opened", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await ready(page);
  await page.waitForLoadState("load");
  expect(requested.some((url) => url.includes("CommandPalette"))).toBe(false);

  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeVisible();
  expect(requested.some((url) => url.includes("CommandPalette"))).toBe(true);
});

for (const shortcut of ["Control+k", "Meta+k"]) {
  test(`${shortcut} opens it with focus in the search field`, async ({
    page,
  }) => {
    await ready(page);
    await page.keyboard.press(shortcut);
    await expect(dialog(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await expect(input(page)).toHaveAttribute("aria-expanded", "true");
  });
}

test("Escape closes it and focus returns to where it was", async ({ page }) => {
  await ready(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(input(page)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("the page behind it is inert while it is open", async ({ page }) => {
  await ready(page);
  await page.keyboard.press("Control+k");
  await expect(input(page)).toBeFocused();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () =>
        document.activeElement === document.body ||
        !!document.activeElement?.closest("dialog"),
    );
    expect(inside).toBe(true);
  }
});

test("the arrow keys move the active option, announced through aria-activedescendant", async ({
  page,
}) => {
  await ready(page);
  await page.keyboard.press("Control+k");
  const options = page.getByRole("option");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  const second = options.nth(1);
  await expect(second).toHaveAttribute("aria-selected", "true");
  const id = await second.getAttribute("id");
  expect(id).toBeTruthy();
  await expect(input(page)).toHaveAttribute("aria-activedescendant", id ?? "");
});

test("typing filters, and Enter goes to the page", async ({ page }) => {
  await ready(page);
  await openPalette(page);
  await page.keyboard.type("about");
  await expect(page.getByRole("option").first()).toHaveText("About");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(dialog(page)).toBeHidden();
});

test("it opens a case study", async ({ page }) => {
  await ready(page);
  await page.keyboard.press("Control+k");
  const study = page
    .getByRole("group", { name: "Case studies" })
    .getByRole("option")
    .first();
  await study.click();
  await expect(page).toHaveURL(/\/work\/[a-z-]+\/?$/);
});

test("it switches the theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await ready(page);
  const html = page.locator("html");

  await openPalette(page);
  await page.keyboard.type("dark theme");
  await page.keyboard.press("Enter");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("status").filter({ hasText: "Dark theme on" }),
  ).toHaveCount(1);

  // The design command is gone (D-038): one design, no switch.
  await openPalette(page);
  await expect(page.getByRole("option", { name: /theme/ })).toHaveCount(1);
  await expect(page.getByRole("option", { name: /design/i })).toHaveCount(0);
});

test("it downloads the CV", async ({ page }) => {
  await ready(page);
  await openPalette(page);
  await page.keyboard.type("download cv");
  const download = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  expect((await download).suggestedFilename()).toBe(
    "Mohamad-Rida-Chouman-CV.pdf",
  );
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no axe violations with it open (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await ready(page);
    await page.keyboard.press("Control+k");
    await expect(input(page)).toBeFocused();
    const results = await new AxeBuilder({ page }).include("dialog").analyze();
    expect(results.violations).toEqual([]);
  });
}

test("it fits a 375 px screen without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await ready(page);
  await trigger(page).click();
  const box = await dialog(page).boundingBox();
  if (!box) throw new Error("The palette has no layout box");
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
