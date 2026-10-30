import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

// public/_headers is applied by Cloudflare Pages, not by `npm run preview`.
// The e2e tests read the built file and replay its headers in the browser, so
// a CSP that would block the site fails here before it is deployed (T-025).
const headersFile = join(process.cwd(), "build", "client", "_headers");

export interface HeaderRule {
  // `Name: value` lines.
  set: Record<string, string>;
  // `! Name` lines: headers a broader rule set that this one removes.
  detach: string[];
}

// Parses Cloudflare's _headers format: an unindented URL pattern, then
// indented `Name: value` or `! Name` lines.
export function parseHeaders(text: string): Map<string, HeaderRule> {
  const rules = new Map<string, HeaderRule>();
  let current: HeaderRule | undefined;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = { set: {}, detach: [] };
      rules.set(line.trim(), current);
    } else if (current) {
      const detach = /^\s*!\s+(\S+)\s*$/.exec(line);
      if (detach) {
        current.detach.push(detach[1]);
        continue;
      }
      const index = line.indexOf(":");
      current.set[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  }
  return rules;
}

export const rules = parseHeaders(readFileSync(headersFile, "utf8"));
export const siteHeaders = rules.get("/*")?.set ?? {};
export const csp = siteHeaders["Content-Security-Policy"] ?? "";

// Whether a _headers pattern matches a path. Only the forms the file uses:
// an exact path, or a prefix ending in `*`.
function matches(pattern: string, path: string): boolean {
  return pattern.endsWith("*")
    ? path.startsWith(pattern.slice(0, -1))
    : path === pattern;
}

// The headers Cloudflare Pages sends for a path, with lower-case names: the
// matching rules in file order, each first removing the headers it detaches,
// then adding its own (joined with a comma when an earlier rule set the same
// header).
export function headersFor(path: string): Record<string, string> {
  const result = new Map<string, string>();
  for (const [pattern, rule] of rules) {
    if (!matches(pattern, path)) continue;
    for (const name of rule.detach) result.delete(name.toLowerCase());
    for (const [name, value] of Object.entries(rule.set)) {
      const key = name.toLowerCase();
      const earlier = result.get(key);
      result.set(key, earlier === undefined ? value : `${earlier}, ${value}`);
    }
  }
  return Object.fromEntries(result);
}

// The replayed headers: the ones that decide what a document may load and
// who may frame it.
const replayed = ["content-security-policy", "x-frame-options"];

// Serves every document, pages and framed files such as the CV, with the
// built CSP and frame headers for its path, as Cloudflare Pages would.
export async function replayCsp(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    if (route.request().resourceType() === "document") {
      const built = headersFor(new URL(route.request().url()).pathname);
      for (const name of replayed) {
        if (name in built) headers[name] = built[name];
      }
    }
    await route.fulfill({ response, headers });
  });
}
