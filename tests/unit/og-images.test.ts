import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ogImagePath } from "~/lib/og-image";

import { loadContent } from "../../content/load";
import { site } from "../../content/site";
import { MAX_OG_IMAGE_BYTES, pngSize } from "../../scripts/finalize-build";
import {
  cardPalette,
  cardSvg,
  escapeXml,
  ogCards,
  renderCard,
  textWidth,
  wrapText,
  writeOgImages,
  type Card,
} from "../../scripts/og-images";
import { oklchToHex } from "../../scripts/oklch";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});

const sans = { family: "Geist", weight: 400, size: 30 };

describe("cardPalette", () => {
  it("is the dark theme with the default accent, as hex colors", () => {
    const palette = cardPalette();
    for (const color of Object.values(palette)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
    // tokens.css: green's dark accent and the dark theme's surface.
    expect(palette.accent).toBe(oklchToHex("oklch(0.82 0.12 180)"));
    expect(palette.surface).toBe(oklchToHex("oklch(0.16 0.008 255)"));
  });

  it("converts OKLCH to sRGB hex", () => {
    expect(oklchToHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(oklchToHex("oklch(0 0 0)")).toBe("#000000");
    expect(oklchToHex("oklch(62.8% 0.2577 29.23)")).toBe("#ff0000");
  });
});

describe("text layout", () => {
  it("measures text with the card's fonts", () => {
    const short = textWidth("Case", sans);
    const long = textWidth("Case study", sans);
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
    expect(textWidth("Case", { ...sans, size: 60 })).toBeCloseTo(short * 2, -1);
  });

  it("keeps a short text on one line", () => {
    expect(wrapText("EV charging platform", sans, 960, 2)).toEqual({
      lines: ["EV charging platform"],
      overflow: false,
    });
  });

  it("wraps at word boundaries within the width", () => {
    const text = "word ".repeat(40).trim();
    const { lines, overflow } = wrapText(text, sans, 400, 10);
    expect(overflow).toBe(false);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(text);
    for (const line of lines) {
      expect(textWidth(line, sans)).toBeLessThanOrEqual(400);
    }
  });

  it("ends with an ellipsis when the text needs more lines", () => {
    const { lines, overflow } = wrapText("word ".repeat(80), sans, 400, 2);
    expect(overflow).toBe(true);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/word…$/);
    expect(textWidth(lines[1], sans)).toBeLessThanOrEqual(400);
  });

  it("escapes text for SVG", () => {
    expect(escapeXml(`a < b & "c" > 'd'`)).toBe(
      "a &lt; b &amp; &quot;c&quot; &gt; &apos;d&apos;",
    );
  });
});

describe("cards", () => {
  const content = loadContent();
  const cards = ogCards(content);

  it("has a site card and one card per case study, from content/", () => {
    expect(cards.map((card) => card.path)).toEqual([
      ogImagePath(),
      ...content.projects.map((project) => ogImagePath(project.slug)),
    ]);
    expect(cards[0]).toMatchObject({
      eyebrow: site.openGraph.site.eyebrow,
      title: content.profile.name,
      summary: content.profile.headline,
    });
    for (const [i, project] of content.projects.entries()) {
      expect(cards[i + 1]).toMatchObject({
        eyebrow: `${site.openGraph.caseStudy.eyebrow} · ${project.sector}`,
        title: project.title,
        summary: project.summary,
        footer: content.profile.name,
      });
    }
  });

  it("draws the card's text, escaped, in the site's typefaces", () => {
    const card: Card = {
      path: "/og/test.png",
      eyebrow: "Case study",
      title: "Tables & drawers",
      summary: "A <short> summary.",
      footer: "Footer",
    };
    const svg = cardSvg(card, cardPalette());
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain(">Tables &amp; drawers</text>");
    expect(svg).toContain(">A &lt;short&gt; summary.</text>");
    expect(svg).toContain(">mr-chouman-portfolio.pages.dev</text>");
    expect(svg).toContain('font-family="Geist Mono"');
    expect(svg).toContain('font-family="Geist" font-weight="600"');
  });

  it("shrinks a long title to fit two lines", () => {
    const title =
      "A very long case study title that cannot fit on two lines at the largest size";
    const svg = cardSvg(
      { path: "/x.png", eyebrow: "E", title, summary: "S", footer: "F" },
      cardPalette(),
    );
    expect(svg).not.toContain('font-weight="600" font-size="64"');
  });

  it("renders a 1200 x 630 PNG small enough for WhatsApp", () => {
    const data = renderCard(cards[1]);
    expect(pngSize(data)).toEqual({ width: 1200, height: 630 });
    expect(data.length).toBeLessThan(MAX_OG_IMAGE_BYTES);
  });
});

describe("writeOgImages", () => {
  it("writes every card at its published path", () => {
    const dir = mkdtempSync(join(tmpdir(), "og-"));
    dirs.push(dir);
    const cards = ogCards().slice(0, 2);
    expect(writeOgImages(dir, cards)).toEqual(cards.map((card) => card.path));
    for (const card of cards) {
      const file = join(dir, ...card.path.split("/").filter(Boolean));
      expect(statSync(file).size).toBeGreaterThan(0);
      expect(pngSize(readFileSync(file))).toEqual({ width: 1200, height: 630 });
    }
  });
});
