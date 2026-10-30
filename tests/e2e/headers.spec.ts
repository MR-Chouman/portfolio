import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

// public/_headers is applied by Cloudflare Pages, not by `npm run preview`.
// These tests read the built file and replay its headers in the browser, so a
// CSP that would block the site fails here before it is deployed (T-025).
const headersFile = join(process.cwd(), "build", "client", "_headers");

// Parses Cloudflare's _headers format: an unindented URL pattern, then
// indented `Name: value` lines.
function parseHeaders(text: string): Map<string, Record<string, string>> {
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

const rules = parseHeaders(readFileSync(headersFile, "utf8"));
const siteHeaders = rules.get("/*") ?? {};
const csp = siteHeaders["Content-Security-Policy"] ?? "";

test("_headers sets security headers and long-caches hashed assets", () => {
  expect(csp).toMatch(/script-src 'self'( 'sha256-[A-Za-z0-9+/]+=*')+;/);
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(siteHeaders["X-Content-Type-Options"]).toBe("nosniff");
  expect(siteHeaders["Referrer-Policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(rules.get("/assets/*")?.["Cache-Control"]).toBe(
    "public, max-age=31536000, immutable",
  );
});

const pages = [
  "/",
  "/work",
  "/work/airline-crew-management",
  "/about",
  "/style-tile",
  "/no-such-page",
];

for (const path of pages) {
  test(`the CSP blocks nothing on ${path}`, async ({ page }) => {
    await page.route("**/*", async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers() };
      if (route.request().resourceType() === "document") {
        headers["content-security-policy"] = csp;
      }
      await route.fulfill({ response, headers });
    });
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(
          `Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`,
        );
      });
    });

    await page.goto(path);
    // Hydration ran: the theme toggle is enabled only after it (D-023).
    const toggle = page.getByRole("button", { name: "Dark theme" });
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", /.+/);
    expect(violations).toEqual([]);
  });
}
