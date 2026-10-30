import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

// public/_headers is applied by Cloudflare Pages, not by `npm run preview`.
// The e2e tests read the built file and replay its headers in the browser, so
// a CSP that would block the site fails here before it is deployed (T-025).
const headersFile = join(process.cwd(), "build", "client", "_headers");

// Parses Cloudflare's _headers format: an unindented URL pattern, then
// indented `Name: value` lines.
export function parseHeaders(
  text: string,
): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  let current: Record<string, string> | undefined;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = {};
      rules.set(line.trim(), current);
    } else if (current) {
      const index = line.indexOf(":");
      current[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  }
  return rules;
}

export const rules = parseHeaders(readFileSync(headersFile, "utf8"));
export const siteHeaders = rules.get("/*") ?? {};
export const csp = siteHeaders["Content-Security-Policy"] ?? "";

// Serves every document with the built CSP, as Cloudflare Pages would.
export async function replayCsp(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    if (route.request().resourceType() === "document") {
      headers["content-security-policy"] = csp;
    }
    await route.fulfill({ response, headers });
  });
}
