import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const sections = [
  "In numbers",
  "Four platforms, one foundation",
  "Reusable foundations first",
  "From biology to frontend lead",
  "Get in touch",
];

test("home is prerendered with its own title and Open Graph tags", async ({
  request,
}) => {
  const html = await (await request.get("/")).text();
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  expect(title).toBeTruthy();
  expect(html).toContain(`<meta property="og:title" content="${title}"/>`);
  expect(html).toContain('<link rel="canonical"');
  // The content is in the HTML before JavaScript runs.
  expect(html).toContain("Four platforms, one foundation");
});

for (const width of [375, 768, 1440]) {
  test.describe(`home at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("shows every section without horizontal scroll", async ({ page }) => {
      await page.goto("/");
      for (const name of sections) {
        await expect(page.getByRole("region", { name })).toBeAttached();
      }
      await expect(
        page
          .getByRole("region", { name: "Four platforms, one foundation" })
          .getByRole("article"),
      ).toHaveCount(4);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("has no axe violations in either theme", async ({ page }) => {
      for (const theme of ["light", "dark"]) {
        await page.emulateMedia({
          colorScheme: theme as "light" | "dark",
        });
        await page.goto("/");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations, theme).toEqual([]);
      }
    });
  });
}

test("hero actions jump to their sections", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get in touch" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole("region", { name: "Get in touch" }),
  ).toBeInViewport();
});

test("a selected work card opens its case study", async ({ page }) => {
  await page.goto("/");
  const work = page.getByRole("region", {
    name: "Four platforms, one foundation",
  });
  const link = work.getByRole("link").first();
  const name = await link.textContent();
  await link.click();
  await expect(page).toHaveURL(/\/work\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name ?? "");
});

test("the header and the contact block link the CV download and the email", async ({
  request,
}) => {
  // Checked in the prerendered HTML, so the links work before JavaScript.
  const html = await (await request.get("/")).text();
  const cvLinks = html.match(/<a [^>]*href="\/cv\.pdf"[^>]*>/g) ?? [];
  expect(cvLinks).toHaveLength(2);
  for (const link of cvLinks) {
    expect(link).toMatch(/download="[\w-]+\.pdf"/);
  }
  expect(html).toMatch(/<a [^>]*href="mailto:[^"]+@[^"]+"/);
  // D-018: no LinkedIn and no phone number on the pages.
  expect(html).not.toMatch(/linkedin\.com|href="tel:/i);
});

test("the header CV link is on every page and reachable by keyboard", async ({
  page,
}) => {
  for (const path of ["/", "/work", "/about"]) {
    await page.goto(path);
    const cv = page
      .getByRole("banner")
      .getByRole("link", { name: "View CV (PDF)" });
    await expect(cv, path).toHaveAttribute("href", "/cv.pdf");
    await cv.focus();
    await expect(cv, path).toBeFocused();
  }
});

// T-055: the contact card is filled like the About card and the work cards,
// in both themes and every accent, and stays AA (axe on the card).
const accents = ["green", "purple", "gold", "red", "blue", "orange"] as const;

for (const theme of ["light", "dark"] as const) {
  test(`the contact card matches the other cards' surface in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    for (const accent of accents) {
      await page.goto(`/?accent=${accent}`);
      await expect(page.locator("html")).toHaveAttribute("data-accent", accent);
      const background = (name: string) =>
        page
          .getByRole("region", { name })
          .evaluate((el) => getComputedStyle(el).backgroundColor);
      const raised = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.backgroundColor = "var(--surface-raised)";
        document.body.append(probe);
        const value = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return value;
      });
      const card = await background("Get in touch");
      expect(card, accent).not.toBe("rgba(0, 0, 0, 0)");
      expect(card, accent).toBe(raised);
      expect(card, accent).toBe(
        await background("From biology to frontend lead"),
      );
      expect(card, accent).toBe(
        await page
          .getByRole("region", { name: "Four platforms, one foundation" })
          .getByRole("article")
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      );
      const results = await new AxeBuilder({ page })
        .include("#contact")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, accent).toEqual([]);
    }
  });
}
