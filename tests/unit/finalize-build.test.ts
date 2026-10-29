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
  cspHash,
  fillHeaders,
  finalizeBuild,
  inlineScripts,
  moveNotFoundPage,
} from "../../scripts/finalize-build";

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
    writeFileSync(join(dir, "index.html"), "<script>home()</script>");
    writeFileSync(join(dir, "_headers"), template);

    finalizeBuild(dir);

    expect(readFileSync(join(dir, "404.html"), "utf8")).toContain("nf()");
    expect(existsSync(join(dir, "404"))).toBe(false);
    const headers = readFileSync(join(dir, "_headers"), "utf8");
    expect(headers).not.toContain(CSP_PLACEHOLDER);
    expect(headers).toContain(cspHash("nf()"));
    expect(headers).toContain(cspHash("home()"));
  });

  it("fails when the 404 page was not prerendered", () => {
    expect(() => moveNotFoundPage(tempDir())).toThrow(/prerender list/);
  });
});
