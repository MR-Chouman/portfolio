import { readdirSync, readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Every project file must have its own prerendered page (T-020, T-022).
const projects = readdirSync("content/projects")
  .filter((name) => name.endsWith(".mdx"))
  .map((name) => {
    const source = readFileSync(`content/projects/${name}`, "utf8");
    return {
      slug: name.replace(/\.mdx$/, ""),
      order: Number(/^order:\s*(\d+)/m.exec(source)?.[1]),
      title: /^title:\s*(.+)$/m.exec(source)?.[1].trim() ?? "",
    };
  })
  .sort((a, b) => a.order - b.order);
const slugs = projects.map(({ slug }) => slug);

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAxeViolations(page: Page, path: string) {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(results.violations, `${path} ${theme}`).toEqual([]);
  }
}

function headTags(html: string) {
  return {
    title: /<title>([^<]+)<\/title>/.exec(html)?.[1],
    ogTitle: /<meta property="og:title" content="([^"]+)"\/>/.exec(html)?.[1],
    ogUrl: /<meta property="og:url" content="([^"]+)"\/>/.exec(html)?.[1],
    ogType: /<meta property="og:type" content="([^"]+)"\/>/.exec(html)?.[1],
  };
}

test.describe("work index", () => {
  test("is prerendered with its own title and Open Graph tags", async ({
    request,
  }) => {
    const html = await (await request.get("/work")).text();
    const tags = headTags(html);
    expect(tags.title).toBeTruthy();
    expect(tags.ogTitle).toBe(tags.title);
    expect(tags.ogUrl).toMatch(/\/work$/);
    for (const { title } of projects) expect(html).toContain(title);
  });

  test("lists every case study and opens one", async ({ page }) => {
    await page.goto("/work");
    await expect(page.getByRole("article")).toHaveCount(projects.length);
    await page.getByRole("link", { name: projects[0].title }).click();
    await expect(page).toHaveURL(`/work/${projects[0].slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: projects[0].title }),
    ).toBeVisible();
  });

  test("the header navigation reaches it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Work", exact: true }).click();
    await expect(page).toHaveURL("/work");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("case study pages", () => {
  for (const slug of slugs) {
    test(`/work/${slug} is prerendered with its own title`, async ({
      page,
      request,
    }) => {
      // The raw HTML, before JavaScript runs, already carries the page's
      // title and Open Graph tags.
      const html = await (await request.get(`/work/${slug}`)).text();
      const tags = headTags(html);
      expect(tags.title).toBeTruthy();
      expect(tags.ogTitle).toBe(tags.title);
      expect(tags.ogUrl).toMatch(new RegExp(`/work/${slug}$`));
      expect(tags.ogType).toBe("article");

      const response = await page.goto(`/work/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(tags.title ?? "");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("the next-project link goes through every case study", async ({
    page,
  }) => {
    await page.goto(`/work/${projects[0].slug}`);
    for (const [index] of projects.entries()) {
      const next = projects[(index + 1) % projects.length];
      await page
        .getByRole("navigation", { name: "More case studies" })
        .getByRole("link", { name: `Next project: ${next.title}` })
        .click();
      await expect(page).toHaveURL(`/work/${next.slug}`);
      await expect(
        page.getByRole("heading", { level: 1, name: next.title }),
      ).toBeVisible();
    }
  });
});

test("case study figures load their images with captions (T-030)", async ({
  page,
}) => {
  await page.goto("/work/airline-crew-management");
  const figures = page.locator(".prose-content figure");
  const count = await figures.count();
  expect(count).toBeGreaterThanOrEqual(2);
  expect(count).toBeLessThanOrEqual(4);
  for (const figure of await figures.all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator("figcaption")).not.toBeEmpty();
    const image = figure.getByRole("img");
    await expect(image).toHaveAttribute("alt", /\S/);
    // Chromium supports AVIF, so the <picture> source is the file it loads.
    await expect
      .poll(() =>
        image.evaluate((img: HTMLImageElement) =>
          img.complete ? img.currentSrc : "",
        ),
      )
      .toMatch(/\.avif$/);
    expect(
      await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);
  }
});

for (const width of [375, 1440]) {
  test.describe(`work pages at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const path of ["/work", `/work/${slugs[0]}`]) {
      test(`${path} has no horizontal scroll or axe violations`, async ({
        page,
      }) => {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        await expectNoAxeViolations(page, path);
      });
    }
  });
}
