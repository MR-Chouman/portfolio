// Build-time checks for the <Figure> images in case study MDX bodies (T-030).
// content/load.ts runs them for every project, so a missing file, a size that
// does not match the file or a missing caption fails `npm run build`.
//
// Figures are written as self-closing JSX with string and integer props:
//   <Figure src="/images/work/<slug>/name.webp" avif="/images/work/<slug>/name.avif"
//     alt="..." caption="..." width={1440} height={900} />
// Images live in public/images/work/<slug>/ (WebP required, AVIF optional).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

export interface ImageSize {
  width: number;
  height: number;
}

// Width and height from a WebP header (lossy VP8, lossless VP8L or VP8X).
export function webpSize(bytes: Buffer): ImageSize | undefined {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return undefined;
  }
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }
  return undefined;
}

// Width and height from the first `ispe` (image spatial extent) box of an
// AVIF file.
export function avifSize(bytes: Buffer): ImageSize | undefined {
  if (bytes.toString("ascii", 4, 8) !== "ftyp") return undefined;
  const box = bytes.indexOf("ispe", 0, "ascii");
  if (box < 0 || box + 16 > bytes.length) return undefined;
  // Box type, then 4 bytes of version and flags, then two 32-bit sizes.
  return {
    width: bytes.readUInt32BE(box + 8),
    height: bytes.readUInt32BE(box + 12),
  };
}

// MDX comments ({/* ... */}) may mention <Figure> as an example.
const COMMENT = /\{\/\*[\s\S]*?\*\/\}/g;
const FIGURE = /<Figure\b([\s\S]*?)\/>/g;
const PROP = /([A-Za-z]+)(?:=(?:"([^"]*)"|\{(\d+)\}))?/g;

export type FigureProps = Record<string, string | number | true>;

// The props of every <Figure /> in an MDX body, in order.
export function readFigures(source: string): FigureProps[] {
  const body = source.replace(COMMENT, "");
  return [...body.matchAll(FIGURE)].map(([, attributes]) => {
    const props: FigureProps = {};
    for (const [, name, text, int] of attributes.matchAll(PROP)) {
      props[name] = text ?? (int === undefined ? true : Number(int));
    }
    return props;
  });
}

function figureSchema(slug: string) {
  const path = (extension: string) =>
    z
      .string()
      .regex(
        new RegExp(`^/images/work/${slug}/[a-z0-9-]+\\.${extension}$`),
        `Use /images/work/${slug}/<name>.${extension}`,
      );
  const text = z.string().trim().min(1);
  return z.strictObject({
    src: path("webp"),
    avif: path("avif").optional(),
    alt: text,
    caption: text,
    width: z.int().positive(),
    height: z.int().positive(),
    priority: z.literal(true).optional(),
  });
}

export type CheckedFigure = z.infer<ReturnType<typeof figureSchema>>;

// Validates the figures of one project. Returns an error message per problem.
export function checkFigures(
  source: string,
  slug: string,
  publicDir: string,
): { figures: CheckedFigure[]; errors: string[] } {
  const schema = figureSchema(slug);
  const figures: CheckedFigure[] = [];
  const errors: string[] = [];

  readFigures(source).forEach((props, index) => {
    const label = `Figure ${index + 1}`;
    const result = schema.safeParse(props);
    if (!result.success) {
      errors.push(`${label}:\n${z.prettifyError(result.error)}`);
      return;
    }
    const figure = result.data;
    figures.push(figure);
    const files: [string, (bytes: Buffer) => ImageSize | undefined][] = [
      [figure.src, webpSize],
    ];
    if (figure.avif) files.push([figure.avif, avifSize]);
    for (const [path, readSize] of files) {
      const file = join(publicDir, path);
      if (!existsSync(file)) {
        errors.push(`${label}: ${path} does not exist in public/.`);
        continue;
      }
      const size = readSize(readFileSync(file));
      if (!size) {
        errors.push(`${label}: cannot read the size of ${path}.`);
      } else if (size.width !== figure.width || size.height !== figure.height) {
        errors.push(
          `${label}: ${path} is ${size.width}x${size.height}, but the figure says ${figure.width}x${figure.height}.`,
        );
      }
    }
  });

  return { figures, errors };
}
