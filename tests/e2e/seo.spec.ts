import { expect, test, type APIRequestContext } from "@playwright/test";

import { SITE_ORIGIN } from "../../app/lib/seo";
import { loadProjects } from "../../content/load";

// Per-route SEO audit (T-060, D-050): every prerendered page has its own
// title and description, its canonical URL is the address it is served at,
// the sitemap lists exactly the indexable pages, robots.txt points at the
// sitemap, and the home page carries a valid JSON-LD Person.

const NOINDEX_PAGES = ["/style-tile/", "/404.html"];

interface Head {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
}

function decode(text: string): string {
  return text
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function readHead(html: string): Head {
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? "";
  const meta = (attr: string, name: string) =>
    new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(head)?.[1];
  const prefixed = (attr: string, prefix: string) =>
    Object.fromEntries(
      [
        ...head.matchAll(
          new RegExp(
            `<meta ${attr}="(${prefix}:[^"]+)" content="([^"]*)"`,
            "g",
          ),
        ),
      ].map(([, key, value]) => [key, decode(value)]),
    );
  const title = /<title>([^<]*)<\/title>/.exec(head)?.[1];
  const description = meta("name", "description");
  return {
    title: title && decode(title),
    description: description && decode(description),
    canonical: /<link rel="canonical" href="([^"]*)"/.exec(head)?.[1],
    robots: meta("name", "robots"),
    og: prefixed("property", "og"),
    twitter: prefixed("name", "twitter"),
    jsonLd: [
      ...head.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ].map(([, json]) => JSON.parse(json) as unknown),
  };
}

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => {
    expect(loc.startsWith(`${SITE_ORIGIN}/`), loc).toBe(true);
    return new URL(loc).pathname;
  });
}

test("robots.txt allows crawling and points at the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toMatch(/^User-agent: \*$/m);
  expect(text).toMatch(/^Allow: \/$/m);
  expect(text).not.toMatch(/^Disallow: \/\s*$/m);
  expect(text).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
});

test("the sitemap is a valid urlset of every indexable page", async ({
  page,
  request,
}) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  // Parse it as XML in the browser: a malformed file yields <parsererror>.
  await page.goto("/");
  const parsed = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, "application/xml");
    const root = doc.documentElement;
    return {
      error: doc.getElementsByTagName("parsererror").length > 0,
      root: root.localName,
      namespace: root.namespaceURI,
      urls: [...root.children].map((url) => ({
        name: url.localName,
        children: [...url.children].map((child) => child.localName),
      })),
    };
  }, xml);
  expect(parsed.error).toBe(false);
  expect(parsed.root).toBe("urlset");
  expect(parsed.namespace).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
  for (const url of parsed.urls) {
    expect(url).toEqual({ name: "url", children: ["loc"] });
  }

  const paths = await sitemapPaths(request);
  const expected = [
    "/",
    "/work/",
    "/about/",
    "/lab/",
    ...loadProjects().map(({ slug }) => `/work/${slug}/`),
  ];
  expect([...paths].sort()).toEqual(expected.sort());
});

test("every page has a unique title and description and a canonical URL at its own address", async ({
  request,
}) => {
  const paths = await sitemapPaths(request);
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  for (const path of [...paths, ...NOINDEX_PAGES]) {
    // The canonical address is served directly, without a redirect.
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    const head = readHead(await response.text());

    expect(head.title, path).toBeTruthy();
    expect(head.description, path).toBeTruthy();
    expect(titles.get(head.title ?? ""), `title of ${path}`).toBeUndefined();
    expect(
      descriptions.get(head.description ?? ""),
      `description of ${path}`,
    ).toBeUndefined();
    titles.set(head.title ?? "", path);
    descriptions.set(head.description ?? "", path);

    if (NOINDEX_PAGES.includes(path)) {
      expect(head.robots, path).toContain("noindex");
      continue;
    }

    expect(head.robots, path).toBeUndefined();
    expect(head.canonical, path).toBe(`${SITE_ORIGIN}${path}`);
    expect(head.og, path).toMatchObject({
      "og:title": head.title,
      "og:description": head.description,
      "og:url": head.canonical,
      "og:site_name": expect.any(String),
    });
    expect(["website", "article"]).toContain(head.og["og:type"]);
    expect(head.twitter, path).toMatchObject({
      "twitter:card": expect.any(String),
      "twitter:title": head.title,
      "twitter:description": head.description,
    });
  }
});

test("home carries a JSON-LD Person and other pages do not", async ({
  request,
}) => {
  const home = readHead(await (await request.get("/")).text());
  expect(home.jsonLd).toHaveLength(1);
  expect(home.jsonLd[0]).toMatchObject({
    "@context": "https://schema.org",
    "@type": "Person",
    name: expect.any(String),
    jobTitle: expect.any(String),
    url: `${SITE_ORIGIN}/`,
    sameAs: [expect.stringMatching(/^https:\/\/github\.com\//)],
  });
  expect(JSON.stringify(home.jsonLd)).not.toMatch(/telephone|"address"/);

  const about = readHead(await (await request.get("/about/")).text());
  expect(about.jsonLd).toHaveLength(0);
});
