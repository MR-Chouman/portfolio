import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { about } from "../../content/about";
import { contact } from "../../content/contact";
import { experience } from "../../content/experience";
import { home } from "../../content/home";
import {
  ContentError,
  PROJECTS_DIR,
  loadContent,
  prerenderPaths,
  readFrontmatter,
} from "../../content/load";
import { profile } from "../../content/profile";
import {
  contactSchema,
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
object: { kind: airplane, label: "A 3D model of an airplane" }
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

  it("prerenders every project slug, the static pages and the 404 page", () => {
    const slugs = readdirSync(PROJECTS_DIR)
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => `/work/${name.replace(/\.mdx$/, "")}`);
    expect(slugs.length).toBeGreaterThan(0);
    expect(prerenderPaths()).toEqual(
      expect.arrayContaining([
        "/",
        "/work",
        "/about",
        "/lab",
        "/style-tile",
        "/404",
        ...slugs,
      ]),
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

  it("requires a 3D object of a known kind with a label (T-034)", () => {
    const frontmatter = readFrontmatter(valid, "sample.mdx") as Record<
      string,
      unknown
    >;
    const { object: _object, ...withoutObject } = frontmatter;
    expect(projectFrontmatterSchema.safeParse(withoutObject).success).toBe(
      false,
    );
    expect(
      projectFrontmatterSchema.safeParse({
        ...frontmatter,
        object: { kind: "rocket", label: "A rocket" },
      }).success,
    ).toBe(false);
    expect(
      projectFrontmatterSchema.safeParse({
        ...frontmatter,
        object: { kind: "airplane", label: " " },
      }).success,
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

describe("contact content", () => {
  it("is valid", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = contactSchema.safeParse({
      ...contact,
      email: { ...contact.email, address: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a CV that is not a PDF path on the site", () => {
    for (const href of ["/cv.docx", "https://example.com/cv.pdf", "cv.pdf"]) {
      const result = contactSchema.safeParse({
        ...contact,
        cv: { ...contact.cv, href },
      });
      expect(result.success, href).toBe(false);
    }
  });

  it("rejects a non-https GitHub link", () => {
    const result = contactSchema.safeParse({
      ...contact,
      github: { ...contact.github, href: "http://github.com/MR-Chouman" },
    });
    expect(result.success).toBe(false);
  });

  it("has no extra contact channels (D-018)", () => {
    expect(Object.keys(contact).sort()).toEqual(["cv", "email", "github"]);
    expect(
      contactSchema.safeParse({
        ...contact,
        linkedin: { label: "LinkedIn", href: "https://linkedin.com" },
      }).success,
    ).toBe(false);
  });
});

// T-035: the hero and About copy is final, and its numbers match
// REQUIREMENTS section 4 and the project files.
describe("final hero and About copy", () => {
  it("has no placeholder text left", () => {
    const copy = JSON.stringify({ profile, experience, home, about });
    expect(copy).not.toMatch(/placeholder/i);
  });

  it("states the headline numbers from REQUIREMENTS section 4", () => {
    const platforms = loadContent().projects.length;
    expect(platforms).toBe(4);
    expect(profile.headline).toContain(`${platforms} systems`);
    expect(profile.headline).toContain("260+ screens");
    expect(profile.metrics).toEqual([
      { value: String(platforms), label: "Admin platforms" },
      { value: "260+", label: "Admin screens" },
      { value: "~3 yrs", label: "Experience" },
    ]);
  });

  it("dates the timeline newest first, with only the current role open", () => {
    const starts = experience.map((entry) => entry.start);
    expect(starts).toEqual([...starts].sort().reverse());
    expect(experience.filter((entry) => entry.end === null)).toHaveLength(1);
    expect(experience[0]?.end).toBeNull();
  });
});
