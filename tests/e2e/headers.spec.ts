import { expect, test } from "@playwright/test";

import { csp, replayCsp, rules, siteHeaders } from "./built-headers";

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

test("_headers does not long-cache the CV, whose URL stays the same", () => {
  // The CV changes without a new file name, so browsers revalidate it
  // instead of keeping the year-long immutable cache of hashed assets.
  expect(rules.get("/cv.pdf")?.["Cache-Control"]).toBe(
    "public, max-age=0, must-revalidate",
  );
});

const pages = [
  "/",
  "/work",
  "/work/airline-crew-management",
  "/about",
  "/lab",
  "/style-tile",
  "/no-such-page",
];

for (const path of pages) {
  test(`the CSP blocks nothing on ${path}`, async ({ page }) => {
    await replayCsp(page);
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
