import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ACCENTS } from "~/lib/accent";

import { contrast } from "./helpers/contrast";

const colorTokens = [
  "surface",
  "surface-raised",
  "fg",
  "fg-muted",
  "line",
  "accent",
  "accent-fg",
  "focus",
] as const;

type Palette = Record<(typeof colorTokens)[number], string>;

// The declarations of the block that follows a `/* <kind>: <name> */` marker
// in tokens.css.
function block(css: string, marker: string): Record<string, string> {
  const start = css.indexOf(`/* ${marker}`);
  if (start === -1) throw new Error(`Missing marker: ${marker}`);
  // The innermost block holding the first declaration after the marker
  // (this also skips an enclosing @media block).
  const firstDeclaration = css.indexOf("--", start);
  const body = css.slice(
    css.lastIndexOf("{", firstDeclaration) + 1,
    css.indexOf("}", firstDeclaration),
  );
  const declarations: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    declarations[name] = value.trim();
  }
  return declarations;
}

function themeBlock(css: string, marker: string): Palette {
  const declarations = block(css, `theme: ${marker} */`);
  const palette: Partial<Palette> = {};
  for (const token of colorTokens) {
    if (token in declarations) palette[token] = declarations[token];
  }
  return palette as Palette;
}

// The palette a theme resolves to with an accent: its `--accent` is a
// `var()` pointing at one of the accent's raw values.
function withAccent(palette: Palette, accent: Record<string, string>): Palette {
  const match = /^var\(--([\w-]+)\)$/.exec(palette.accent);
  if (!match) throw new Error(`--accent is not a var(): ${palette.accent}`);
  const value = accent[match[1]];
  if (!value) throw new Error(`The accent does not set --${match[1]}`);
  return { ...palette, accent: value };
}

// The color values for both themes and every accent live at the end of
// tokens.css (D-038, D-040).
describe("theme tokens", () => {
  const css = readFileSync(
    join(process.cwd(), "app/styles/tokens.css"),
    "utf8",
  );
  const themes = {
    light: themeBlock(css, "light"),
    dark: themeBlock(css, "dark (explicit)"),
  };

  it.each(Object.keys(themes))("sets every color token in %s", (theme) => {
    const palette = themes[theme as keyof typeof themes];
    expect(Object.keys(palette).sort()).toEqual([...colorTokens].sort());
  });

  it("uses the same dark values for system preference and explicit choice", () => {
    expect(themeBlock(css, "dark (system preference)")).toEqual(themes.dark);
  });

  it("points the accent at the value for its theme", () => {
    expect(themes.light.accent).toBe("var(--accent-light)");
    expect(themes.dark.accent).toBe("var(--accent-dark)");
  });

  it("has one block per accent, green first as the default", () => {
    const markers = [...css.matchAll(/\/\* accent: (\w+)/g)].map((m) => m[1]);
    expect(markers).toEqual([...ACCENTS]);
    expect(css).toMatch(/\/\* accent: green \(default\) \*\/\s*:root,/);
  });

  const cases = ACCENTS.flatMap((accent) =>
    Object.entries(themes).map(([theme, palette]) => ({
      name: `${theme} theme, ${accent} accent`,
      palette: withAccent(palette, block(css, `accent: ${accent}`)),
    })),
  );

  describe.each(cases)("$name", ({ palette }) => {
    it.each(["surface", "surface-raised"] as const)(
      "meets WCAG AA on %s",
      (background) => {
        const bg = palette[background];
        expect(contrast(palette.fg, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette["fg-muted"], bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.accent, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.focus, bg)).toBeGreaterThanOrEqual(3);
      },
    );

    it("meets WCAG AA for text on the accent", () => {
      expect(
        contrast(palette["accent-fg"], palette.accent),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
});
