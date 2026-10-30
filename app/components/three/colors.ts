// Colors of the 3D objects come from the design tokens (D-032), so
// they follow the theme. Tokens may use OKLCH, which Three.js
// cannot parse, so each one is painted on a 1x1 canvas and read back as an
// sRGB number (0xrrggbb).

export interface ObjectColors {
  primary: number;
  accent: number;
  detail: number;
}

// Material slot -> token it reads.
export const COLOR_TOKENS: Record<keyof ObjectColors, string> = {
  primary: "--fg",
  accent: "--accent",
  detail: "--fg-muted",
};

// Mid grey, for a color the canvas cannot draw.
const FALLBACK = 0x808080;

// Any CSS color -> 0xrrggbb, through a 2D canvas.
export function toRgb(
  color: string,
  context: CanvasRenderingContext2D | null,
): number {
  if (!context || !color) return FALLBACK;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "transparent";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
  // An invalid color leaves the fill transparent.
  if (a === 0) return FALLBACK;
  return (r << 16) | (g << 8) | b;
}

export function readColors(element: Element): ObjectColors {
  const style = getComputedStyle(element);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const read = (token: string) =>
    toRgb(style.getPropertyValue(token).trim(), context);
  return {
    primary: read(COLOR_TOKENS.primary),
    accent: read(COLOR_TOKENS.accent),
    detail: read(COLOR_TOKENS.detail),
  };
}

// Calls `listener` whenever the theme on <html> changes.
export function observeTokens(listener: () => void): () => void {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
