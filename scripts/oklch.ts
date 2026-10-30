// OKLCH colors as tokens.css writes them (`oklch(0.82 0.12 180)`) or as the
// minified build serves them (`oklch(82% .12 180)`), converted to sRGB. Used
// by the contrast tests and by the Open Graph card renderer (T-061), which
// cannot read CSS custom properties. Kept outside app/, where the token
// contract test forbids raw color values.

export type Rgb = [number, number, number];

// Linear-light sRGB channels in [0, 1], clamped to the gamut.
export function parseOklch(value: string): Rgb {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(
    value.trim(),
  );
  if (!match) throw new Error(`Not an oklch() color: ${value}`);
  const [l, c, h] = [match[1], match[3], match[4]].map(Number);
  return oklchToLinearSrgb(match[2] ? l / 100 : l, c, h);
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

// `#rrggbb` for an oklch() color, gamma-encoded as sRGB.
export function oklchToHex(value: string): string {
  const encode = (v: number) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return `#${parseOklch(value)
    .map((v) =>
      Math.round(encode(v) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
