// Open Graph card images (T-061, D-051). Called from the `buildEnd` hook in
// react-router.config.ts before scripts/finalize-build.ts checks them.
//
// Each card is an SVG drawn here and rasterized to a 1200 x 630 PNG by resvg
// with the site's own typefaces (Geist and Geist Mono, static TTF copies in
// scripts/og-fonts/, since resvg cannot read the WOFF2 files the site
// serves). Colors are the dark theme's tokens with the default accent, read
// from app/styles/tokens.css, so the cards follow the design. PNG because
// LinkedIn, WhatsApp and the other scrapers do not all read WebP or AVIF.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";

import { DEFAULT_ACCENT } from "../app/lib/accent";
import { oklchToHex } from "./oklch";
import {
  OG_IMAGE_HEIGHT as HEIGHT,
  OG_IMAGE_WIDTH as WIDTH,
  ogImagePath,
} from "../app/lib/og-image";
import { SITE_ORIGIN } from "../app/lib/seo";
import { loadContent, type Content } from "../content/load";
import { site } from "../content/site";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = join(ROOT, "scripts", "og-fonts");
const TOKENS_CSS = join(ROOT, "app", "styles", "tokens.css");

const RESVG_OPTIONS: ResvgRenderOptions = {
  font: {
    loadSystemFonts: false,
    fontFiles: [
      "Geist-Regular.ttf",
      "Geist-SemiBold.ttf",
      "GeistMono-Regular.ttf",
    ].map((file) => join(FONT_DIR, file)),
    defaultFontFamily: "Geist",
  },
  fitTo: { mode: "original" },
  logLevel: "error",
};

export interface Card {
  // Published path of the PNG, from ogImagePath().
  path: string;
  eyebrow: string;
  title: string;
  summary: string;
  // Bottom left, beside the site's address on the right.
  footer: string;
}

export interface Palette {
  surface: string;
  surfaceRaised: string;
  fg: string;
  fgMuted: string;
  line: string;
  accent: string;
}

// The declarations of the first rule after a `/* <marker>` comment in
// tokens.css (an enclosing @media block is skipped).
function tokenBlock(css: string, marker: string): Record<string, string> {
  const start = css.indexOf(`/* ${marker}`);
  if (start === -1) throw new Error(`tokens.css has no "/* ${marker}" block.`);
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

// The dark theme with the default accent, as sRGB hex colors.
export function cardPalette(
  css: string = readFileSync(TOKENS_CSS, "utf8"),
): Palette {
  const theme = tokenBlock(css, "theme: dark (explicit)");
  const accent = tokenBlock(css, `accent: ${DEFAULT_ACCENT}`);
  const resolve = (name: string): string => {
    const value = theme[name];
    if (!value) throw new Error(`The dark theme does not set --${name}.`);
    const reference = /^var\(--([\w-]+)\)$/.exec(value)?.[1];
    const color = reference ? accent[reference] : value;
    if (!color) throw new Error(`The accent does not set --${reference}.`);
    return oklchToHex(color);
  };
  return {
    surface: resolve("surface"),
    surfaceRaised: resolve("surface-raised"),
    fg: resolve("fg"),
    fgMuted: resolve("fg-muted"),
    line: resolve("line"),
    accent: resolve("accent"),
  };
}

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

interface Font {
  family: string;
  weight: number;
  size: number;
}

function textAttributes({ family, weight, size }: Font): string {
  return `font-family="${family}" font-weight="${weight}" font-size="${size}"`;
}

// Width in pixels of a line of text, measured by resvg itself with the same
// fonts, so wrapping matches what is drawn.
export function textWidth(text: string, font: Font): number {
  if (text.trim() === "") return 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="400"><text x="0" y="200" ${textAttributes(font)}>${escapeXml(text)}</text></svg>`;
  return new Resvg(svg, RESVG_OPTIONS).getBBox()?.width ?? 0;
}

// Greedy word wrap into at most `maxLines` lines no wider than `maxWidth`.
// `overflow` is true when the text did not fit; the last line then ends with
// an ellipsis.
export function wrapText(
  text: string,
  font: Font,
  maxWidth: number,
  maxLines: number,
): { lines: string[]; overflow: boolean } {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  let index = 0;
  for (; index < words.length; index++) {
    const word = words[index];
    const candidate = current ? `${current} ${word}` : word;
    if (!current || textWidth(candidate, font) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines) {
    lines.push(current);
    return { lines, overflow: false };
  }
  // Out of lines with words left: shorten the last line to fit an ellipsis.
  let last = lines[maxLines - 1];
  while (last.includes(" ") && textWidth(`${last}…`, font) > maxWidth) {
    last = last.slice(0, last.lastIndexOf(" "));
  }
  lines[maxLines - 1] = `${last.replace(/[\s,.;:·-]+$/, "")}…`;
  return { lines, overflow: true };
}

const MONO = "Geist Mono";
const SANS = "Geist";

// Layout, in pixels of the 1200 x 630 card.
const FRAME = 48;
const PAD = 72;
const LEFT = FRAME + PAD;
const RIGHT = WIDTH - FRAME - PAD;
const TEXT_WIDTH = RIGHT - LEFT;
const EYEBROW: Font = { family: MONO, weight: 400, size: 26 };
const SUMMARY: Font = { family: SANS, weight: 400, size: 30 };
const FOOTER: Font = { family: MONO, weight: 400, size: 24 };
// The title takes the largest size at which it fits on two lines.
const TITLE_SIZES = [64, 56, 48];

function textLines(
  lines: string[],
  font: Font,
  fill: string,
  firstBaseline: number,
  lineHeight: number,
): string {
  return lines
    .map(
      (line, i) =>
        `<text x="${LEFT}" y="${firstBaseline + i * lineHeight}" ${textAttributes(font)} fill="${fill}">${escapeXml(line)}</text>`,
    )
    .join("\n  ");
}

export function cardSvg(card: Card, palette: Palette): string {
  let title = { lines: [card.title], overflow: false };
  let titleFont: Font = { family: SANS, weight: 600, size: TITLE_SIZES[0] };
  for (const size of TITLE_SIZES) {
    titleFont = { family: SANS, weight: 600, size };
    title = wrapText(card.title, titleFont, TEXT_WIDTH, 2);
    if (!title.overflow) break;
  }
  const titleLineHeight = Math.round(titleFont.size * 1.17);
  const titleBaseline = 228;
  const summaryBaseline =
    titleBaseline + (title.lines.length - 1) * titleLineHeight + 64;
  const summaryLineHeight = 42;
  // Room above the rule for three lines after a one-line title, two after a
  // two-line title.
  const summary = wrapText(
    card.summary,
    SUMMARY,
    TEXT_WIDTH,
    title.lines.length === 1 ? 3 : 2,
  );
  const ruleY = 470;
  const footerBaseline = 528;
  const host = new URL(SITE_ORIGIN).host;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.surface}"/>
  <rect x="${FRAME}" y="${FRAME}" width="${WIDTH - 2 * FRAME}" height="${HEIGHT - 2 * FRAME}" rx="24" fill="${palette.surfaceRaised}" stroke="${palette.line}" stroke-width="2"/>
  <rect x="${LEFT}" y="${FRAME + 66}" width="14" height="14" rx="3" fill="${palette.accent}"/>
  <text x="${LEFT + 30}" y="${FRAME + 82}" ${textAttributes(EYEBROW)} fill="${palette.accent}">${escapeXml(card.eyebrow)}</text>
  ${textLines(title.lines, titleFont, palette.fg, titleBaseline, titleLineHeight)}
  ${textLines(summary.lines, SUMMARY, palette.fgMuted, summaryBaseline, summaryLineHeight)}
  <rect x="${LEFT}" y="${ruleY}" width="${TEXT_WIDTH}" height="2" fill="${palette.line}"/>
  <text x="${LEFT}" y="${footerBaseline}" ${textAttributes(FOOTER)} fill="${palette.fg}">${escapeXml(card.footer)}</text>
  <text x="${RIGHT}" y="${footerBaseline}" text-anchor="end" ${textAttributes(FOOTER)} fill="${palette.accent}">${escapeXml(host)}</text>
</svg>
`;
}

export function renderCard(
  card: Card,
  palette: Palette = cardPalette(),
): Buffer {
  return new Resvg(cardSvg(card, palette), RESVG_OPTIONS).render().asPng();
}

// The site card and one card per case study, all from content/.
export function ogCards(content: Content = loadContent()): Card[] {
  const { openGraph } = site;
  return [
    {
      path: ogImagePath(),
      eyebrow: openGraph.site.eyebrow,
      title: content.profile.name,
      summary: content.profile.headline,
      footer: content.profile.role,
    },
    ...content.projects.map((project) => ({
      path: ogImagePath(project.slug),
      eyebrow: `${openGraph.caseStudy.eyebrow} · ${project.sector}`,
      title: project.title,
      summary: project.summary,
      footer: content.profile.name,
    })),
  ];
}

// Writes every card under the client build directory and returns their
// published paths.
export function writeOgImages(
  clientDir: string,
  cards: Card[] = ogCards(),
): string[] {
  const palette = cardPalette();
  for (const card of cards) {
    const file = join(clientDir, ...card.path.split("/").filter(Boolean));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderCard(card, palette));
  }
  return cards.map((card) => card.path);
}
