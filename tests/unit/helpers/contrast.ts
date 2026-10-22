// WCAG 2.2 contrast for OKLCH colors, as written in the skin files.

type Rgb = [number, number, number];

export function parseOklch(value: string): Rgb {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(
    value.trim(),
  );
  if (!match) throw new Error(`Not an oklch() color: ${value}`);
  const [l, c, h] = match.slice(1).map(Number);
  return oklchToLinearSrgb(l, c, h);
}

function oklchToLinearSrgb(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(parseOklch(a)), luminance(parseOklch(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
