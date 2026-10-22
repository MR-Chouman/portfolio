import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDir = join(process.cwd(), "app");
const tokensCss = readFileSync(join(appDir, "styles/tokens.css"), "utf8");

// Token files (tokens.css, skins/) are the only place raw values may live.
function sourceFiles(): string[] {
  return readdirSync(appDir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(tsx?|css)$/.test(file))
    .filter((file) => !/^styles[\\/](tokens\.css|skins[\\/])/.test(file))
    .map((file) => join(appDir, file));
}

const rawValuePatterns: [string, RegExp][] = [
  ["hex color", /(?<![\w&])#[0-9a-fA-F]{3,8}\b(?![\w-])/],
  ["color function", /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/],
  [
    "arbitrary color, font or radius utility",
    /\b(?:bg|text|border(?:-[trblxy])?|ring|outline|fill|stroke|from|via|to|decoration|caret|accent|shadow|font|rounded(?:-[a-z]+)?)-\[[^\]]+\]/,
  ],
];

describe("design token contract", () => {
  it.each([
    "surface",
    "surface-raised",
    "fg",
    "fg-muted",
    "line",
    "accent",
    "accent-fg",
    "focus",
  ])("maps the %s color token to Tailwind", (token) => {
    expect(tokensCss).toContain(`--color-${token}: var(--${token});`);
  });

  it("sets every color token in the dark theme", () => {
    const dark = tokensCss.slice(tokensCss.indexOf(':root[data-theme="dark"]'));
    for (const token of ["surface", "fg", "fg-muted", "accent", "focus"]) {
      expect(dark).toContain(`--${token}:`);
    }
  });

  it("resets Tailwind's default colors, fonts, radii and text sizes", () => {
    for (const namespace of ["color", "font", "radius", "text"]) {
      expect(tokensCss).toContain(`--${namespace}-*: initial;`);
    }
  });

  it("finds no raw color, font or radius values outside token files", () => {
    const offenders = sourceFiles().flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          rawValuePatterns
            .filter(([, pattern]) => pattern.test(line))
            .map(([kind]) => `${file}:${index + 1} ${kind}: ${line.trim()}`),
        ),
    );
    expect(offenders).toEqual([]);
  });
});
