import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { experience } from "../../content/experience";
import {
  ContentError,
  PROJECTS_DIR,
  loadContent,
  prerenderPaths,
  readFrontmatter,
} from "../../content/load";
import { profile } from "../../content/profile";
import {
  experienceSchema,
  profileSchema,
  projectFrontmatterSchema,
} from "../../content/schema";

const valid = `---
title: Sample platform
summary: An invented project used by the tests.
sector: Testing
role: Frontend lead
stack: [React]
metrics:
  - { value: "1", label: "Screens" }
order: 1
---

Body text.
`;

let dirs: string[] = [];

function projectsDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "content-test-"));
  dirs.push(dir);
  for (const [name, source] of Object.entries(files)) {
    writeFileSync(join(dir, name), source);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("content in the repository", () => {
  it("is valid", () => {
    expect(() => loadContent()).not.toThrow();
  });

  it("prerenders every project slug and the static pages", () => {
    const slugs = readdirSync(PROJECTS_DIR)
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => `/work/${name.replace(/\.mdx$/, "")}`);
    expect(slugs.length).toBeGreaterThan(0);
    expect(prerenderPaths()).toEqual(
      expect.arrayContaining(["/", "/work", "/about", "/style-tile", ...slugs]),
    );
  });

  it("orders projects by their order field", () => {
    const orders = loadContent().projects.map((project) => project.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("project validation", () => {
  it("accepts a valid project and derives the slug from the file name", () => {
    const dir = projectsDir({ "sample-platform.mdx": valid });
    expect(prerenderPaths(dir)).toContain("/work/sample-platform");
  });

  it("rejects a file name that is not a kebab-case slug", () => {
    const dir = projectsDir({ "Sample_Platform.mdx": valid });
    expect(() => prerenderPaths(dir)).toThrow(/file name/);
  });

  it("rejects a file without frontmatter", () => {
    const dir = projectsDir({ "sample.mdx": "# No frontmatter\n" });
    expect(() => prerenderPaths(dir)).toThrow(/missing YAML frontmatter/);
  });

  it("rejects invalid YAML", () => {
    const dir = projectsDir({ "sample.mdx": "---\ntitle: [unclosed\n---\n" });
    expect(() => prerenderPaths(dir)).toThrow(/not valid YAML/);
  });

  it("names the file and the field of a schema error", () => {
    const dir = projectsDir({
      "sample.mdx": valid.replace("order: 1", "order: first"),
    });
    expect(() => prerenderPaths(dir)).toThrow(ContentError);
    expect(() => prerenderPaths(dir)).toThrow(/sample\.mdx[\s\S]*order/);
  });

  it("rejects unknown keys, which are usually typos", () => {
    const dir = projectsDir({
      "sample.mdx": valid.replace("sector:", "sectr:"),
    });
    expect(() => prerenderPaths(dir)).toThrow(/sectr/);
  });

  it("rejects two projects with the same order", () => {
    const dir = projectsDir({ "one.mdx": valid, "two.mdx": valid });
    expect(() => prerenderPaths(dir)).toThrow(/share order 1/);
  });

  it("rejects an empty projects folder", () => {
    const dir = projectsDir({});
    expect(() => prerenderPaths(dir)).toThrow(/No projects/);
  });

  it("requires a stack and at least one metric", () => {
    const frontmatter = readFrontmatter(valid, "sample.mdx") as Record<
      string,
      unknown
    >;
    expect(
      projectFrontmatterSchema.safeParse({ ...frontmatter, stack: [] }).success,
    ).toBe(false);
    expect(
      projectFrontmatterSchema.safeParse({ ...frontmatter, metrics: [] })
        .success,
    ).toBe(false);
  });
});

describe("profile and experience validation", () => {
  it("rejects a profile without metrics or with blank text", () => {
    expect(profileSchema.safeParse({ ...profile, metrics: [] }).success).toBe(
      false,
    );
    expect(profileSchema.safeParse({ ...profile, name: "  " }).success).toBe(
      false,
    );
  });

  it("rejects an experience entry that ends before it starts", () => {
    const [entry] = experience;
    const result = experienceSchema.safeParse([
      { ...entry, start: "2025-03", end: "2024-12" },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects dates that are not YYYY-MM", () => {
    const [entry] = experience;
    expect(
      experienceSchema.safeParse([{ ...entry, start: "2024-13" }]).success,
    ).toBe(false);
  });
});
