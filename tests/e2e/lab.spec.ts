import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The lab's server-style data table (T-051): the state lives in the URL, so
// reload and back/forward bring the same view back; loading, empty and error
// states are reachable. The data is the seeded mock (D-044): 240 assets.

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const table = (page: Page) => page.getByRole("table");
const rows = (page: Page) => table(page).locator("tbody tr");
const firstId = (page: Page) =>
  rows(page).first().getByRole("rowheader").textContent();
const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: /of \d+|No matching|Loading/ });

async function loaded(page: Page) {
  await expect(table(page)).toHaveAttribute("aria-busy", "false");
}

test("lab is prerendered with its own title, canonical URL and heading", async ({
  request,
}) => {
  const html = await (await request.get("/lab")).text();
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  expect(title).toMatch(/^Lab/);
  expect(html).toContain(`<meta property="og:title" content="${title}"/>`);
  expect(html).toMatch(/<link rel="canonical" href="[^"]+\/lab\/"\/>/);
  expect(html).toContain("Server-style data table");
});

test("the header navigation reaches it and the table loads", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Lab", exact: true }).click();
  await expect(page).toHaveURL("/lab");
  await loaded(page);
  await expect(rows(page)).toHaveCount(10);
  await expect(status(page)).toHaveText("1–10 of 240");
  await expect(page.getByText("Page 1 of 24")).toBeVisible();
});

test("sorting, filtering and paging write the URL and survive a reload", async ({
  page,
}) => {
  await page.goto("/lab");
  await loaded(page);

  await page.getByRole("button", { name: "Name", exact: true }).click();
  await expect(page).toHaveURL("/lab?sort=name&dir=asc");
  await loaded(page);
  await expect(
    page.getByRole("columnheader", { name: "Name", exact: true }),
  ).toHaveAttribute("aria-sort", "ascending");

  // The checkbox follows the URL, so it shows checked once the navigation
  // starts.
  await page.getByRole("checkbox", { name: "Active" }).click();
  await expect(page.getByRole("checkbox", { name: "Active" })).toBeChecked();
  await expect(page).toHaveURL("/lab?status=active&sort=name&dir=asc");
  await loaded(page);
  const total = Number(/of (\d+)/.exec(await status(page).innerText())?.[1]);
  expect(total).toBeGreaterThan(10);
  expect(total).toBeLessThan(240);
  for (const cell of await rows(page).locator("td:nth-child(4)").all()) {
    await expect(cell).toHaveText("Active");
  }

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL("/lab?status=active&sort=name&dir=asc&page=2");
  await loaded(page);
  const pageTwo = await firstId(page);

  await page.reload();
  await loaded(page);
  await expect(page.getByRole("checkbox", { name: "Active" })).toBeChecked();
  await expect(page.getByText(/^Page 2 of/)).toBeVisible();
  expect(await firstId(page)).toBe(pageTwo);
});

test("back and forward restore the table state", async ({ page }) => {
  await page.goto("/lab");
  await loaded(page);
  const pageOne = await firstId(page);

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL("/lab?page=2");
  await loaded(page);
  const pageTwo = await firstId(page);
  expect(pageTwo).not.toBe(pageOne);

  await page.getByLabel("Rows per page").selectOption("25");
  await expect(page).toHaveURL("/lab?size=25");
  await loaded(page);
  await expect(rows(page)).toHaveCount(25);

  await page.goBack();
  await expect(page).toHaveURL("/lab?page=2");
  await loaded(page);
  await expect(rows(page)).toHaveCount(10);
  expect(await firstId(page)).toBe(pageTwo);
  await expect(page.getByLabel("Rows per page")).toHaveValue("10");

  await page.goBack();
  await expect(page).toHaveURL("/lab");
  await loaded(page);
  expect(await firstId(page)).toBe(pageOne);

  await page.goForward();
  await expect(page).toHaveURL("/lab?page=2");
  await loaded(page);
  expect(await firstId(page)).toBe(pageTwo);
});

test("search filters after typing, and an unmatched search is empty", async ({
  page,
}) => {
  await page.goto("/lab");
  await loaded(page);
  const search = page.getByRole("searchbox", { name: "Search" });

  await search.fill("AST-0007");
  await expect(page).toHaveURL("/lab?q=AST-0007");
  await loaded(page);
  await expect(rows(page)).toHaveCount(1);

  await search.fill("no such asset");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=no\+such\+asset/);
  await loaded(page);
  await expect(table(page).getByText("No matching assets")).toBeVisible();
  await expect(status(page)).toHaveText("No matching assets");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL("/lab");
  await loaded(page);
  await expect(search).toHaveValue("");
  await expect(rows(page)).toHaveCount(10);

  await page.goBack();
  await expect(search).toHaveValue("no such asset");
});

test("shows a loading state while a request runs", async ({ page }) => {
  await page.goto("/lab");
  await loaded(page);
  await page.getByRole("button", { name: "Next page" }).click();
  // The mock endpoint answers after about 400 ms.
  await expect(table(page)).toHaveAttribute("aria-busy", "true");
  await expect(status(page)).toHaveText("Loading assets…");
  await loaded(page);
});

test("a failed request shows the error state, and retrying recovers", async ({
  page,
}) => {
  await page.goto("/lab?status=retired");
  await loaded(page);
  await page.getByRole("button", { name: "Simulate a server error" }).click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("The assets could not be loaded");
  await expect(page).toHaveURL("/lab?status=retired");
  await expect(page.getByRole("checkbox", { name: "Retired" })).toBeChecked();

  await alert.getByRole("button", { name: "Try again" }).click();
  await loaded(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(rows(page).first()).toBeVisible();
});

test("is keyboard operable", async ({ page }) => {
  await page.goto("/lab");
  await loaded(page);
  const header = page.getByRole("button", { name: "Value", exact: true });
  await header.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/lab?sort=value");
  await loaded(page);
  await expect(header).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/lab?sort=value&dir=asc");

  const checkbox = page.getByRole("checkbox", { name: "Vehicle" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL("/lab?category=vehicle&sort=value&dir=asc");
});

for (const width of [375, 768, 1440]) {
  test.describe(`lab at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("has no page-level sideways scroll or axe violations", async ({
      page,
    }) => {
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto("/lab?status=maintenance");
        await loaded(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        const results = await new AxeBuilder({ page })
          .withTags(axeTags)
          .analyze();
        expect(results.violations).toEqual([]);
      }
    });
  });
}
