import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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

// Reads the declarations of the block that follows a `/* theme: <name> */`
// marker in tokens.css.
function themeBlock(css: string, marker: string): Palette {
  const start = css.indexOf(`/* theme: ${marker} */`);
  if (start === -1) throw new Error(`Missing theme marker: ${marker}`);
  // The innermost block holding the first declaration after the marker
  // (this also skips an enclosing @media block).
  const firstDeclaration = css.indexOf("--", start);
  const body = css.slice(
    css.lastIndexOf("{", firstDeclaration) + 1,
    css.indexOf("}", firstDeclaration),
  );
  const palette: Partial<Palette> = {};
  for (const token of colorTokens) {
    const match = new RegExp(`--${token}:\\s*([^;]+);`).exec(body);
    if (match) palette[token] = match[1].trim();
  }
  return palette as Palette;
}

// The color values for both themes live at the end of tokens.css (D-038).
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

  describe.each(Object.entries(themes))("%s theme", (_, palette) => {
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
