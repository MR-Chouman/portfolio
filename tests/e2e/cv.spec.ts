import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { replayCsp } from "./built-headers";

// T-024: the CV PDF the owner added to public/ is served as a PDF, and both
// CV links (header and home contact block) download it.
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
      page.getByRole("banner").getByRole("link", { name: "Download CV (PDF)" }),
  },
  {
    where: "the contact block",
    find: (page: Page) => page.getByRole("main").locator('a[href="/cv.pdf"]'),
  },
];

for (const { where, find } of links) {
  test(`the CV link in ${where} downloads the PDF under the CSP`, async ({
    page,
  }) => {
    await replayCsp(page);
    await page.goto("/");
    const link = find(page);
    await expect(link).toHaveCount(1);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      link.click(),
    ]);
    expect(download.suggestedFilename()).toBe(fileName);
    const path = await download.path();
    expect(statSync(path).size).toBe(statSync(source).size);
  });
}
