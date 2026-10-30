import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  BuildError,
  CSP_PLACEHOLDER,
  MAX_HEADERS_LINE,
  MAX_OG_IMAGE_BYTES,
  SITEMAP_URL,
  checkOgImages,
  cspHash,
  fillHeaders,
  finalizeBuild,
  indexablePages,
  inlineScripts,
  moveNotFoundPage,
  pageImage,
  pageSeo,
  pngSize,
  robotsTxt,
  servedPath,
  sitemapXml,
} from "../../scripts/finalize-build";
import { SITE_ORIGIN } from "~/lib/seo";

const dirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "finalize-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});

const template = `/*\n  Content-Security-Policy: script-src 'self' ${CSP_PLACEHOLDER}\n`;

describe("inlineScripts", () => {
  it("returns inline scripts and skips external and empty ones", () => {
    const html = `<head><script>a()</script><script type="module" src="/x.js"></script>
      <script type="module">import "/y.js";</script><script></script></head>`;
    expect(inlineScripts(html)).toEqual(["a()", 'import "/y.js";']);
  });

  it("skips data blocks such as JSON-LD, which browsers never run", () => {
    const html = `<script type="application/ld+json">{"a":1}</script>
      <script type="text/javascript">b()</script>`;
    expect(inlineScripts(html)).toEqual(["b()"]);
  });
});

describe("cspHash", () => {
  it("is the base64 sha256 of the script text, quoted for CSP", () => {
    const expected = createHash("sha256").update("a()").digest("base64");
    expect(cspHash("a()")).toBe(`'sha256-${expected}'`);
  });
});

describe("fillHeaders", () => {
  it("replaces the placeholder with the hashes", () => {
    expect(fillHeaders(template, ["'sha256-a'", "'sha256-b'"])).toContain(
      "script-src 'self' 'sha256-a' 'sha256-b'",
    );
  });

  it("fails without a placeholder or without hashes", () => {
    expect(() => fillHeaders("/*\n  X-Frame-Options: DENY\n", ["'x'"])).toThrow(
      BuildError,
    );
    expect(() => fillHeaders(template, [])).toThrow(/no inline scripts/);
  });

  it("fails when a line is over Cloudflare's limit", () => {
    const hashes = Array.from(
      { length: Math.ceil(MAX_HEADERS_LINE / 50) },
      (_, i) => cspHash(String(i)),
    );
    expect(() => fillHeaders(template, hashes)).toThrow(/over Cloudflare/);
  });
});

describe("finalizeBuild", () => {
  it("moves the 404 page to the root and fills the CSP", () => {
    const dir = tempDir();
    mkdirSync(join(dir, "404"));
    writeFileSync(join(dir, "404", "index.html"), "<script>nf()</script>");
    writeFileSync(
      join(dir, "index.html"),
      `${canonical("/")}${ogImage("/og/site.png")}<script>home()</script>`,
    );
    writePage(dir, "og/site.png", png(1200, 630));
    writeFileSync(join(dir, "_headers"), template);

    finalizeBuild(dir);

    expect(readFileSync(join(dir, "404.html"), "utf8")).toContain("nf()");
    expect(existsSync(join(dir, "404"))).toBe(false);
    const headers = readFileSync(join(dir, "_headers"), "utf8");
    expect(headers).not.toContain(CSP_PLACEHOLDER);
    expect(headers).toContain(cspHash("nf()"));
    expect(headers).toContain(cspHash("home()"));
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toBe(
      sitemapXml([`${SITE_ORIGIN}/`]),
    );
    expect(readFileSync(join(dir, "robots.txt"), "utf8")).toBe(robotsTxt());
  });

  it("fails when the 404 page was not prerendered", () => {
    expect(() => moveNotFoundPage(tempDir())).toThrow(/prerender list/);
  });
});

function canonical(path: string): string {
  return `<link rel="canonical" href="${SITE_ORIGIN}${path}"/>`;
}
const noindex = '<meta name="robots" content="noindex"/>';

// The Open Graph and Twitter image tags pageMeta writes.
function ogImage(
  path: string,
  { width = 1200, height = 630, twitter = `${SITE_ORIGIN}${path}` } = {},
): string {
  return [
    `<meta property="og:image" content="${SITE_ORIGIN}${path}"/>`,
    `<meta property="og:image:width" content="${width}"/>`,
    `<meta property="og:image:height" content="${height}"/>`,
    `<meta name="twitter:image" content="${twitter}"/>`,
  ].join("");
}

// The start of a PNG file: signature and IHDR chunk with the given size.
function png(width: number, height: number, padding = 0): Buffer {
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write("IHDR", 4, "latin1");
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ihdr,
    Buffer.alloc(padding),
  ]);
}

function writePage(dir: string, file: string, html: string | Buffer): void {
  const path = join(dir, file);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, html);
}

describe("pageSeo", () => {
  it("reads the canonical URL and the noindex directive", () => {
    expect(pageSeo(`<head>${canonical("/a/")}</head>`)).toEqual({
      canonical: `${SITE_ORIGIN}/a/`,
      noindex: false,
    });
    expect(pageSeo(`<meta name="robots" content="noindex, follow"/>`)).toEqual({
      canonical: undefined,
      noindex: true,
    });
    expect(pageSeo(`<meta name="description" content="noindex"/>`)).toEqual({
      canonical: undefined,
      noindex: false,
    });
  });
});

describe("servedPath", () => {
  it("is the URL path Cloudflare Pages serves a file at", () => {
    expect(servedPath("index.html")).toBe("/");
    expect(servedPath(join("work", "ev-charging", "index.html"))).toBe(
      "/work/ev-charging/",
    );
    expect(servedPath("404.html")).toBe("/404.html");
  });
});

describe("indexablePages", () => {
  it("lists pages with a canonical URL and no noindex, sorted", () => {
    const dir = tempDir();
    writePage(dir, "index.html", canonical("/"));
    writePage(dir, "work/index.html", canonical("/work/"));
    writePage(dir, "about/index.html", canonical("/about/"));
    writePage(
      dir,
      "style-tile/index.html",
      canonical("/style-tile/") + noindex,
    );
    writePage(dir, "404.html", noindex);
    writePage(dir, "__spa-fallback.html", "<title>x</title>");

    expect(indexablePages(dir)).toEqual([
      `${SITE_ORIGIN}/`,
      `${SITE_ORIGIN}/about/`,
      `${SITE_ORIGIN}/work/`,
    ]);
  });

  it("fails when a canonical URL is not the page's own address", () => {
    const dir = tempDir();
    writePage(dir, "about/index.html", canonical("/about"));
    expect(() => indexablePages(dir)).toThrow(BuildError);
    expect(() => indexablePages(dir)).toThrow(/served at .*\/about\//);
  });

  it("fails when there is nothing to list", () => {
    const dir = tempDir();
    writePage(dir, "404.html", noindex);
    expect(() => indexablePages(dir)).toThrow(/no indexable pages/);
  });
});

describe("sitemapXml and robotsTxt", () => {
  it("writes a sitemaps.org urlset with escaped absolute URLs", () => {
    const xml = sitemapXml([`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/a/?b=1&c=2`]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(xml).toContain(`<loc>${SITE_ORIGIN}/</loc>`);
    expect(xml).toContain(`<loc>${SITE_ORIGIN}/a/?b=1&amp;c=2</loc>`);
    expect(xml.trimEnd()).toMatch(/<\/urlset>$/);
  });

  it("allows every crawler and points at the sitemap", () => {
    expect(robotsTxt()).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${SITEMAP_URL}\n`,
    );
    expect(SITEMAP_URL).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });
});

describe("Open Graph image checks", () => {
  it("reads a PNG's size from its header", () => {
    expect(pngSize(png(1200, 630))).toEqual({ width: 1200, height: 630 });
    expect(pngSize(Buffer.from("<svg/>"))).toBeUndefined();
  });

  it("reads the image a page names", () => {
    expect(pageImage(`<head>${ogImage("/og/a.png")}</head>`)).toEqual({
      url: `${SITE_ORIGIN}/og/a.png`,
      width: 1200,
      height: 630,
      twitter: `${SITE_ORIGIN}/og/a.png`,
    });
    expect(pageImage("<head></head>")).toBeUndefined();
  });

  it("accepts pages whose images exist with their declared size", () => {
    const dir = tempDir();
    writePage(dir, "index.html", canonical("/") + ogImage("/og/site.png"));
    writePage(
      dir,
      "work/a/index.html",
      canonical("/work/a/") + ogImage("/og/work/a.png"),
    );
    writePage(
      dir,
      "style-tile/index.html",
      canonical("/style-tile/") + noindex,
    );
    writePage(dir, "og/site.png", png(1200, 630));
    writePage(dir, "og/work/a.png", png(1200, 630));
    expect(checkOgImages(dir)).toEqual(["/og/site.png", "/og/work/a.png"]);
  });

  it("fails when an indexable page has no image", () => {
    const dir = tempDir();
    writePage(dir, "about/index.html", canonical("/about/"));
    expect(() => checkOgImages(dir)).toThrow(/has no og:image/);
  });

  it("fails when the image file is missing", () => {
    const dir = tempDir();
    writePage(dir, "index.html", canonical("/") + ogImage("/og/site.png"));
    expect(() => checkOgImages(dir)).toThrow(/did not write/);
  });

  it("fails when the image is not a PNG of the declared size", () => {
    const dir = tempDir();
    writePage(dir, "index.html", canonical("/") + ogImage("/og/site.png"));
    writePage(dir, "og/site.png", "<svg/>");
    expect(() => checkOgImages(dir)).toThrow(/not a PNG/);
    writePage(dir, "og/site.png", png(1200, 600));
    expect(() => checkOgImages(dir)).toThrow(/1200 x 600/);
  });

  it("fails when the image is too large for WhatsApp", () => {
    const dir = tempDir();
    writePage(dir, "index.html", canonical("/") + ogImage("/og/site.png"));
    writePage(dir, "og/site.png", png(1200, 630, MAX_OG_IMAGE_BYTES));
    expect(() => checkOgImages(dir)).toThrow(/bytes, over/);
  });

  it("fails on an image on another origin or a different Twitter image", () => {
    const dir = tempDir();
    writePage(
      dir,
      "index.html",
      canonical("/") +
        '<meta property="og:image" content="https://example.com/a.png"/>',
    );
    expect(() => checkOgImages(dir)).toThrow(/not on/);
    writePage(
      dir,
      "index.html",
      canonical("/") +
        ogImage("/og/site.png", { twitter: `${SITE_ORIGIN}/og/other.png` }),
    );
    expect(() => checkOgImages(dir)).toThrow(/twitter:image/);
  });
});
