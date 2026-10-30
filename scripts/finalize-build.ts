// Post-build steps for Cloudflare Pages (T-025, D-027). Called from the
// `buildEnd` hook in react-router.config.ts, after every page is prerendered.
//
// 1. The catch-all route is prerendered at /404 (404/index.html). It moves to
//    404.html at the root, which Cloudflare Pages serves with a 404 status for
//    every URL that matches no file. Without a top-level 404.html, Pages
//    treats the site as a single-page app and answers unknown URLs with the
//    home page and a 200 status.
// 2. `_headers` (copied from public/) holds a Content-Security-Policy whose
//    script-src lists the sha256 hash of every inline script in the
//    prerendered HTML (the pre-paint theme script of D-023 and React Router's
//    hydration scripts). The placeholder in public/_headers is replaced with
//    those hashes, so no inline script needs 'unsafe-inline'. JSON-LD data
//    blocks are not run, so they need no hash.
// 3. sitemap.xml and robots.txt are written from the prerendered pages
//    (T-060, D-050): every page with a canonical URL and no noindex tag is
//    listed, and its canonical URL must be the URL the page is served at.
import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";

import { SITE_ORIGIN, canonicalUrl } from "../app/lib/seo";

export const CSP_PLACEHOLDER = "__CSP_SCRIPT_HASHES__";

// Cloudflare Pages limits for _headers (developers.cloudflare.com/pages/
// configuration/headers/): 100 rules, 2,000 characters per line.
export const MAX_HEADERS_LINE = 2000;
export const MAX_HEADERS_RULES = 100;

export class BuildError extends Error {
  override name = "BuildError";
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

// Contents of every <script> element without a src attribute. Script
// elements are raw text, so the source text is exactly what the browser
// hashes.
export function inlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    const [, attributes, contents] = match;
    if (/\bsrc\s*=/i.test(attributes) || contents.length === 0) continue;
    if (isDataBlock(attributes)) continue;
    scripts.push(contents);
  }
  return scripts;
}

// A script whose type is not JavaScript (or "module") is a data block, such
// as JSON-LD: browsers never run it, so CSP does not apply to it.
function isDataBlock(attributes: string): boolean {
  const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attributes)?.[1];
  if (!type) return false;
  return !/^(module|(text|application)\/(java|ecma)script)$/i.test(type);
}

export function cspHash(script: string): string {
  return `'sha256-${createHash("sha256").update(script, "utf8").digest("base64")}'`;
}

export function moveNotFoundPage(clientDir: string): void {
  const source = join(clientDir, "404", "index.html");
  if (!existsSync(source)) {
    throw new BuildError(
      `Expected the prerendered 404 page at ${source}. Is /404 in the prerender list?`,
    );
  }
  renameSync(source, join(clientDir, "404.html"));
  rmSync(join(clientDir, "404"), { recursive: true });
}

export function fillHeaders(template: string, hashes: string[]): string {
  if (!template.includes(CSP_PLACEHOLDER)) {
    throw new BuildError(
      `_headers has no ${CSP_PLACEHOLDER} placeholder in its Content-Security-Policy.`,
    );
  }
  if (hashes.length === 0) {
    throw new BuildError("Found no inline scripts to hash for the CSP.");
  }
  const headers = template.replaceAll(CSP_PLACEHOLDER, hashes.join(" "));

  const lines = headers.split(/\r?\n/);
  const long = lines.find((line) => line.length > MAX_HEADERS_LINE);
  if (long) {
    throw new BuildError(
      `A _headers line is ${long.length} characters, over Cloudflare's limit of ${MAX_HEADERS_LINE}: ${long.slice(0, 60)}...`,
    );
  }
  // A rule is an unindented URL pattern; comments start with #.
  const rules = lines.filter((line) => /^[^\s#]/.test(line)).length;
  if (rules > MAX_HEADERS_RULES) {
    throw new BuildError(
      `_headers has ${rules} rules, over Cloudflare's limit of ${MAX_HEADERS_RULES}.`,
    );
  }
  return headers;
}

export function writeHeaders(clientDir: string): string[] {
  const file = join(clientDir, "_headers");
  if (!existsSync(file)) {
    throw new BuildError(`Expected ${file}, copied from public/_headers.`);
  }
  const hashes = new Set<string>();
  for (const page of htmlFiles(clientDir)) {
    for (const script of inlineScripts(readFileSync(page, "utf8"))) {
      hashes.add(cspHash(script));
    }
  }
  const sorted = [...hashes].sort();
  writeFileSync(file, fillHeaders(readFileSync(file, "utf8"), sorted));
  return sorted;
}

interface PageSeo {
  canonical?: string;
  noindex: boolean;
}

function attribute(tag: string, name: string): string | undefined {
  return new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1];
}

// The canonical URL and robots directive of a prerendered page.
export function pageSeo(html: string): PageSeo {
  let canonical: string | undefined;
  let noindex = false;
  for (const [tag] of html.matchAll(/<(?:link|meta)\b[^>]*>/gi)) {
    if (/^<link/i.test(tag) && attribute(tag, "rel") === "canonical") {
      canonical = attribute(tag, "href");
    }
    if (
      /^<meta/i.test(tag) &&
      attribute(tag, "name")?.toLowerCase() === "robots" &&
      /\bnoindex\b/i.test(attribute(tag, "content") ?? "")
    ) {
      noindex = true;
    }
  }
  return { canonical, noindex };
}

// The URL path Cloudflare Pages serves a file at: `about/index.html` is
// `/about/`, `index.html` is `/`.
export function servedPath(file: string): string {
  const path = file.split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html"))
    return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

// Canonical URLs of the pages to list in the sitemap, sorted. Fails when an
// indexable page has a canonical URL other than its own address, or when two
// pages claim the same one.
export function indexablePages(clientDir: string): string[] {
  const urls = new Map<string, string>();
  for (const page of htmlFiles(clientDir)) {
    const file = relative(clientDir, page);
    const { canonical, noindex } = pageSeo(readFileSync(page, "utf8"));
    if (!canonical || noindex) continue;
    const expected = canonicalUrl(servedPath(file));
    if (canonical !== expected) {
      throw new BuildError(
        `${file} has the canonical URL ${canonical}, but it is served at ${expected}.`,
      );
    }
    const other = urls.get(canonical);
    if (other) {
      throw new BuildError(
        `${other} and ${file} share the canonical URL ${canonical}.`,
      );
    }
    urls.set(canonical, file);
  }
  if (urls.size === 0) {
    throw new BuildError("Found no indexable pages for the sitemap.");
  }
  return [...urls.keys()].sort();
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// sitemaps.org protocol 0.9. No lastmod: the build has no reliable
// per-page modification date, and a wrong one is worse than none.
export function sitemapXml(urls: string[]): string {
  const entries = urls.map(
    (url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>\n`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("")}</urlset>\n`;
}

export const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

// Every crawler may fetch every path; pages that must stay out of search
// results say so with a noindex tag, which crawlers only see if they can
// fetch the page.
export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITEMAP_URL}\n`;
}

export function writeSeoFiles(clientDir: string): string[] {
  const urls = indexablePages(clientDir);
  writeFileSync(join(clientDir, "sitemap.xml"), sitemapXml(urls));
  writeFileSync(join(clientDir, "robots.txt"), robotsTxt());
  return urls;
}

export function finalizeBuild(clientDir: string): void {
  moveNotFoundPage(clientDir);
  const hashes = writeHeaders(clientDir);
  const urls = writeSeoFiles(clientDir);
  console.info(
    `Finalize: ${relative(process.cwd(), join(clientDir, "404.html"))} written; CSP lists ${hashes.length} inline script hashes; sitemap lists ${urls.length} pages.`,
  );
}
