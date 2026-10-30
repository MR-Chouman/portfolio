import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  avifSize,
  checkFigures,
  readFigures,
  webpSize,
} from "../../content/figures";
import { PROJECTS_DIR, PUBLIC_DIR, prerenderPaths } from "../../content/load";

const SLUG = "airline-crew-management";
const IMAGES = join(PUBLIC_DIR, "images", "work", SLUG);

const figure = (props: string) => `<Figure\n  ${props}\n/>`;
const validProps = [
  `src="/images/work/sample/roster.webp"`,
  `avif="/images/work/sample/roster.avif"`,
  `alt="An invented roster"`,
  `caption="Illustration with invented data."`,
  "width={1440}",
  "height={900}",
].join("\n  ");

let dirs: string[] = [];

// A temporary public/ folder holding one real WebP and AVIF pair.
function publicDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "figures-test-"));
  dirs.push(dir);
  const images = join(dir, "images", "work", "sample");
  mkdirSync(images, { recursive: true });
  copyFileSync(join(IMAGES, "roster.webp"), join(images, "roster.webp"));
  copyFileSync(join(IMAGES, "roster.avif"), join(images, "roster.avif"));
  return dir;
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("image size readers", () => {
  it("read the size of the case study images", () => {
    const webp = readFileSync(join(IMAGES, "roster.webp"));
    const avif = readFileSync(join(IMAGES, "roster.avif"));
    expect(webpSize(webp)).toEqual({ width: 1440, height: 900 });
    expect(avifSize(avif)).toEqual({ width: 1440, height: 900 });
  });

  it("return undefined for other files", () => {
    const text = Buffer.from("not an image, just some text for the header");
    expect(webpSize(text)).toBeUndefined();
    expect(avifSize(text)).toBeUndefined();
  });
});

describe("readFigures", () => {
  it("reads string, integer and boolean props", () => {
    expect(readFigures(figure(`${validProps}\n  priority`))).toEqual([
      {
        src: "/images/work/sample/roster.webp",
        avif: "/images/work/sample/roster.avif",
        alt: "An invented roster",
        caption: "Illustration with invented data.",
        width: 1440,
        height: 900,
        priority: true,
      },
    ]);
  });

  it("ignores figures inside MDX comments", () => {
    expect(
      readFigures(`{/* Use <Figure src="..." width={...} /> here. */}`),
    ).toEqual([]);
  });
});

describe("checkFigures", () => {
  it("accepts figures whose files exist with the stated size", () => {
    const { figures, errors } = checkFigures(
      figure(validProps),
      "sample",
      publicDir(),
    );
    expect(errors).toEqual([]);
    expect(figures).toHaveLength(1);
  });

  it("rejects a size that does not match the file", () => {
    const { errors } = checkFigures(
      figure(validProps.replace("{900}", "{750}")),
      "sample",
      publicDir(),
    );
    expect(errors.join("\n")).toMatch(/1440x900, but the figure says 1440x750/);
  });

  it("rejects a missing file", () => {
    const { errors } = checkFigures(
      figure(validProps.replaceAll("roster", "missing")),
      "sample",
      publicDir(),
    );
    expect(errors.join("\n")).toMatch(/missing\.webp does not exist/);
    expect(errors.join("\n")).toMatch(/missing\.avif does not exist/);
  });

  it("rejects images outside the project's folder and missing captions", () => {
    const { errors } = checkFigures(
      figure(
        validProps
          .replace("/work/sample/roster.webp", "/work/other/roster.webp")
          .replace(`caption="Illustration with invented data."`, ""),
      ),
      "sample",
      publicDir(),
    );
    const message = errors.join("\n");
    expect(message).toMatch(/\/images\/work\/sample\/<name>\.webp/);
    expect(message).toMatch(/caption/);
  });

  it("fails the build through the content loader", () => {
    const projects = mkdtempSync(join(tmpdir(), "figures-projects-"));
    dirs.push(projects);
    const source = readFileSync(join(PROJECTS_DIR, `${SLUG}.mdx`), "utf8");
    writeFileSync(
      join(projects, `${SLUG}.mdx`),
      source.replace("width={1440}", "width={1200}"),
    );
    expect(() => prerenderPaths(projects)).toThrow(
      /Invalid figures in .*airline-crew-management\.mdx/,
    );
  });
});

describe("airline crew management case study (T-030)", () => {
  it("has 2-4 captioned figures, each with WebP and AVIF files", () => {
    const source = readFileSync(join(PROJECTS_DIR, `${SLUG}.mdx`), "utf8");
    const { figures, errors } = checkFigures(source, SLUG, PUBLIC_DIR);
    expect(errors).toEqual([]);
    expect(figures.length).toBeGreaterThanOrEqual(2);
    expect(figures.length).toBeLessThanOrEqual(4);
    for (const item of figures) {
      expect(item.avif).toBeDefined();
      expect(item.caption).toMatch(/invented/);
    }
  });

  it("has the context, role, scope, decisions and outcome sections", () => {
    const source = readFileSync(join(PROJECTS_DIR, `${SLUG}.mdx`), "utf8");
    const headings = [...source.matchAll(/^#{2,3} (.+)$/gm)].map(
      ([, heading]) => heading,
    );
    expect(headings).toEqual([
      "Context",
      "What I owned",
      "Scope",
      "Key decisions",
      "Single sign-on",
      "Rostering",
      "Approvals",
      "Outcome",
    ]);
  });
});
