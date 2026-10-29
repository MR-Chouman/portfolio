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
//    those hashes, so no inline script needs 'unsafe-inline'.
import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

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
    scripts.push(contents);
  }
  return scripts;
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

export function finalizeBuild(clientDir: string): void {
  moveNotFoundPage(clientDir);
  const hashes = writeHeaders(clientDir);
  console.info(
    `Finalize: ${relative(process.cwd(), join(clientDir, "404.html"))} written; CSP lists ${hashes.length} inline script hashes.`,
  );
}
