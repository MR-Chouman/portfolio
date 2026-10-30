import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { replayCsp } from "./built-headers";

// T-024: the CV PDF the owner added to public/ is served as a PDF.
// T-056: both CV links (header and home contact card) open a preview dialog
// that shows the PDF inline on desktop, a note on phones, and a download.
const source = join(process.cwd(), "public", "cv.pdf");
const fileName = "Mohamad-Rida-Chouman-CV.pdf";

test("/cv.pdf is served as a PDF", async ({ request }) => {
  const response = await request.get("/cv.pdf");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/pdf\b/);
  const body = await response.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(body.equals(readFileSync(source))).toBe(true);
});

const links = [
  {
    where: "the header",
    find: (page: Page) =>
      page.getByRole("banner").getByRole("link", { name: "View CV (PDF)" }),
  },
  {
    where: "the contact card",
    find: (page: Page) =>
      page.getByRole("main").getByRole("link", { name: /View CV/ }),
  },
];

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Curriculum vitae" });

// The links open the dialog only once hydrated; before that they download.
async function hydrated(page: Page, path = "/") {
  await page.goto(path);
  await expect(
    page.getByRole("button", { name: "Open command palette" }),
  ).toBeEnabled();
}

// The headless test browser has no PDF viewer (navigator.pdfViewerEnabled is
// false), so the desktop tests report one, as desktop Chrome, Edge, Firefox
// and Safari do.
async function withPdfViewer(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "pdfViewerEnabled", {
      get: () => true,
    });
  });
}

for (const { where, find } of links) {
  test(`the CV link in ${where} opens the preview, which downloads the PDF under the CSP`, async ({
    page,
  }) => {
    await replayCsp(page);
    await withPdfViewer(page);
    await hydrated(page);
    const link = find(page);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("aria-haspopup", "dialog");
    await link.click();
    await expect(dialog(page)).toBeVisible();
    await expect(
      dialog(page).getByRole("button", { name: "Close" }),
    ).toBeFocused();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog(page)
        .getByRole("link", { name: /Download/ })
        .click(),
    ]);
    expect(download.suggestedFilename()).toBe(fileName);
    const path = await download.path();
    expect(statSync(path).size).toBe(statSync(source).size);

    // Escape closes it and focus returns to the link.
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(link).toBeFocused();
  });
}

test("the desktop preview shows the PDF in a frame the headers allow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await replayCsp(page);
  await withPdfViewer(page);
  const refused: string[] = [];
  page.on("console", (message) => {
    if (/refused|content security policy/i.test(message.text())) {
      refused.push(message.text());
    }
  });
  await hydrated(page);
  const pdf = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/cv.pdf" &&
      response.request().frame() !== page.mainFrame(),
  );
  await find(page).click();
  const frame = dialog(page).locator('iframe[title="CV preview"]');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("src", /^\/cv\.pdf/);
  const response = await pdf;
  expect(response.status()).toBe(200);
  expect(response.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(response.headers()["content-security-policy"]).toBe(
    "frame-ancestors 'self'",
  );
  await expect(dialog(page).getByText(/cannot show the PDF/)).toHaveCount(0);
  await expect(
    dialog(page).getByRole("link", { name: "Open in a new tab" }),
  ).toHaveAttribute("href", "/cv.pdf");
  expect(refused).toEqual([]);

  function find(page: Page) {
    return page
      .getByRole("banner")
      .getByRole("link", { name: "View CV (PDF)" });
  }
});

test("at 375 px the preview shows the note with Open and Download instead of a frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await withPdfViewer(page);
  await hydrated(page);
  await links[0].find(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator("iframe")).toHaveCount(0);
  await expect(
    dialog(page).getByText(
      "This browser cannot show the PDF inside the page. Open it in a new tab or download it.",
    ),
  ).toBeVisible();
  const open = dialog(page).getByRole("link", { name: "Open in a new tab" });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute("href", "/cv.pdf");
  await expect(open).toHaveAttribute("target", "_blank");
  const download = dialog(page).getByRole("link", { name: /Download/ });
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute("download", fileName);
  // The dialog fits the phone screen: nothing scrolls sideways.
  const box = await dialog(page).boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
});

test("a browser without a PDF viewer gets the note on desktop too", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await hydrated(page);
  await links[0].find(page).click();
  await expect(dialog(page).locator("iframe")).toHaveCount(0);
  await expect(dialog(page).getByText(/cannot show the PDF/)).toBeVisible();
});

test("the preview is keyboard usable: focus stays inside, the close button returns focus", async ({
  page,
}) => {
  await withPdfViewer(page);
  await hydrated(page);
  const link = links[0].find(page);
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  const close = dialog(page).getByRole("button", { name: "Close" });
  await expect(close).toBeFocused();

  // Tab moves through the dialog's controls and never reaches the page.
  for (let step = 0; step < 3; step += 1) {
    await page.keyboard.press("Tab");
    const inside = await dialog(page).evaluate((element) =>
      element.contains(document.activeElement),
    );
    expect(inside, `Tab ${step + 1}`).toBe(true);
  }
  await expect(
    dialog(page).getByRole("link", { name: /Download/ }),
  ).toBeFocused();

  await close.focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toHaveCount(0);
  await expect(link).toBeFocused();
});

test("a click on the backdrop closes the preview", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await hydrated(page);
  await links[0].find(page).click();
  await expect(dialog(page)).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(dialog(page)).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [375, 1280]) {
    test(`the open preview has no axe violations in ${theme} at ${width} px`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width, height: 800 });
      await withPdfViewer(page);
      await hydrated(page);
      await links[0].find(page).click();
      await expect(dialog(page)).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include("dialog")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
