import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The lab's create and edit drawer (T-052): a native modal dialog with a
// Zod-validated form; a save shows in the table at once and rolls back when
// the mock endpoint fails it. The data is the seeded mock (D-044): 240
// assets, AST-0001 to AST-0240, so a new one is AST-0241.

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const table = (page: Page) => page.getByRole("table");
const rows = (page: Page) => table(page).locator("tbody tr");
const drawer = (page: Page) => page.getByRole("dialog");
const createButton = (page: Page) =>
  page.getByRole("button", { name: "New asset" });

async function loaded(page: Page) {
  await expect(table(page)).toHaveAttribute("aria-busy", "false");
}

async function open(page: Page, url = "/lab") {
  await page.goto(url);
  await loaded(page);
}

test("creates an asset with the keyboard: validation, then an optimistic row", async ({
  page,
}) => {
  await open(page);
  await createButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(drawer(page)).toBeVisible();
  await expect(drawer(page)).toHaveAccessibleName("New asset");
  const name = drawer(page).getByLabel("Name");
  await expect(name).toBeFocused();

  // Enter in a field submits; the empty form is rejected.
  await page.keyboard.press("Enter");
  await expect(drawer(page)).toBeVisible();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("Enter a name.");
  await expect(drawer(page).getByLabel("Site")).toHaveAccessibleDescription(
    "Choose a site.",
  );
  await expect(name).toBeFocused();

  await page.keyboard.type("Spare forklift");
  await expect(name).not.toHaveAttribute("aria-invalid");
  await page.keyboard.press("Tab");
  await expect(drawer(page).getByLabel("Category")).toBeFocused();
  await drawer(page).getByLabel("Category").selectOption("vehicle");
  await drawer(page).getByLabel("Site").selectOption("Harbor yard");
  const value = drawer(page).getByLabel("Value (USD)");
  await value.focus();
  await page.keyboard.type("12.5");
  await page.keyboard.press("Enter");
  await expect(value).toHaveAccessibleDescription(
    "Digits only, for example 12500. Enter a whole number of 0 or more, digits only.",
  );
  await value.fill("12500");
  await page.keyboard.press("Enter");

  await expect(drawer(page)).toHaveCount(0);
  await expect(createButton(page)).toBeFocused();
  // Shown at once, before the mock endpoint answers (about 400 ms).
  const first = rows(page).first();
  await expect(first).toContainText("Saving…");
  await expect(first.getByRole("rowheader")).toHaveText("New");
  await expect(first).toContainText("Spare forklift");

  await expect(page.getByText("Spare forklift saved.")).toBeVisible();
  await loaded(page);
  await expect(first.getByRole("rowheader")).toHaveText("AST-0241");
  await expect(first).toContainText("Harbor yard");
  await expect(first).toContainText("$12,500");
  await expect(first).not.toContainText("Saving…");

  // The new asset is stored: a search finds it.
  await page.getByRole("searchbox").fill("AST-0241");
  await expect(page).toHaveURL("/lab?q=AST-0241");
  await loaded(page);
  await expect(rows(page)).toHaveCount(1);
});

test("edits an asset; Escape and Cancel close without saving and return focus", async ({
  page,
}) => {
  await open(page, "/lab?sort=id&dir=asc");
  const first = rows(page).first();
  await expect(first.getByRole("rowheader")).toHaveText("AST-0001");
  const edit = first.getByRole("button", { name: /^Edit / });
  const original = (await edit.getAttribute("aria-label")) ?? "";

  await edit.focus();
  await page.keyboard.press("Enter");
  await expect(drawer(page)).toHaveAccessibleName("Edit AST-0001");
  await expect(drawer(page).getByLabel("Name")).toHaveValue(
    original.replace(/^Edit /, ""),
  );
  await page.keyboard.type(" (moved)");
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toHaveCount(0);
  await expect(edit).toBeFocused();
  await expect(first).not.toContainText("(moved)");

  await page.keyboard.press("Enter");
  await drawer(page).getByRole("button", { name: "Cancel" }).click();
  await expect(drawer(page)).toHaveCount(0);
  await expect(edit).toBeFocused();

  await page.keyboard.press("Enter");
  const name = drawer(page).getByLabel("Name");
  await name.fill("Relabelled pump");
  await drawer(page).getByLabel("Status").selectOption("maintenance");
  await drawer(page).getByRole("button", { name: "Save asset" }).click();
  await expect(first).toContainText("Relabelled pump");
  await expect(first).toContainText("Saving…");
  await loaded(page);
  await expect(first).not.toContainText("Saving…");
  await expect(first.getByRole("rowheader")).toHaveText("AST-0001");
  await expect(first).toContainText("Relabelled pump");
  await expect(first).toContainText("Maintenance");
  await expect(
    first.getByRole("button", { name: "Edit Relabelled pump" }),
  ).toBeFocused();
});

test("a failed save shows at once, then rolls back with an alert", async ({
  page,
}) => {
  await open(page, "/lab?sort=id&dir=asc");
  const first = rows(page).first();
  const before = await first.innerText();
  await first.getByRole("button", { name: /^Edit / }).click();
  await drawer(page).getByLabel("Name").fill("Never stored");
  await drawer(page).getByLabel("Make this save fail").check();
  await drawer(page).getByRole("button", { name: "Save asset" }).click();

  await expect(first).toContainText("Never stored");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Never stored was not saved");
  await expect(first).not.toContainText("Never stored");
  expect(await first.innerText()).toBe(before);

  await alert.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("focus stays in the drawer and a backdrop click closes it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await createButton(page).click();
  await expect(drawer(page).getByLabel("Name")).toBeFocused();
  for (let step = 0; step < 10; step += 1) {
    await page.keyboard.press("Shift+Tab");
    const inside = await drawer(page).evaluate((element) =>
      element.contains(document.activeElement),
    );
    // Focus may leave for the browser's own controls, never for the page.
    const onPage = await page.evaluate(
      () =>
        document.activeElement !== null &&
        document.activeElement !== document.body &&
        !document.querySelector("dialog")?.contains(document.activeElement),
    );
    expect(inside || !onPage, `Shift+Tab ${step + 1}`).toBe(true);
  }
  // The drawer sits at the right edge: a click at the left is the backdrop.
  await page.mouse.click(8, 400);
  await expect(drawer(page)).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [375, 1280]) {
    test(`the open drawer, with errors, has no axe violations in ${theme} at ${width} px`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width, height: 800 });
      await open(page);
      await createButton(page).click();
      await drawer(page).getByRole("button", { name: "Save asset" }).click();
      await expect(drawer(page).getByLabel("Name")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      const box = await drawer(page).boundingBox();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? Infinity)).toBeLessThanOrEqual(
        width + 1,
      );
      // The save button is reachable on a phone.
      await expect(
        drawer(page).getByRole("button", { name: "Save asset" }),
      ).toBeInViewport();
      const results = await new AxeBuilder({ page })
        .include("dialog")
        .withTags(axeTags)
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
