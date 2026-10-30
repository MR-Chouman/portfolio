// WCAG 2.2 contrast for OKLCH colors, as written in tokens.css or as the
// minified build serves them (lightness as a percentage, e.g.
// `oklch(95% .004 250)`).

import { parseOklch, type Rgb } from "../../../scripts/oklch";

export { parseOklch };

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(parseOklch(a)), luminance(parseOklch(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
