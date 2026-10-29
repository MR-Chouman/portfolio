// Build-time content validation (T-020, D-025). Runs in Node from
// react-router.config.ts, so any invalid file fails `npm run build` (and
// `npm run dev`) with a message naming the file and the field.
import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";
import { z } from "zod";

import { about } from "./about";
import { contact } from "./contact";
import { experience } from "./experience";
import { home } from "./home";
import { profile } from "./profile";
import { work } from "./work";
import {
  aboutSchema,
  contactSchema,
  experienceSchema,
  homeSchema,
  profileSchema,
  projectFrontmatterSchema,
  slugSchema,
  workSchema,
  type About,
  type Contact,
  type Experience,
  type Home,
  type Profile,
  type ProjectSummary,
  type Work,
} from "./schema";

export const PROJECTS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "projects",
);

export class ContentError extends Error {
  override name = "ContentError";
}

function check<T>(schema: z.ZodType<T>, data: unknown, source: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ContentError(
      `Invalid content in ${source}:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

// Reads the YAML frontmatter block at the top of an MDX file.
export function readFrontmatter(source: string, file: string): unknown {
  const match = FRONTMATTER.exec(source);
  if (!match) {
    throw new ContentError(
      `Invalid content in ${file}: missing YAML frontmatter (--- ... ---) at the top of the file.`,
    );
  }
  try {
    return parseYaml(match[1]);
  } catch (error) {
    throw new ContentError(
      `Invalid content in ${file}: frontmatter is not valid YAML.\n${String(error)}`,
    );
  }
}

export function loadProjects(dir: string = PROJECTS_DIR): ProjectSummary[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();
  if (files.length === 0) {
    throw new ContentError(`No projects found in ${dir}.`);
  }

  const projects = files.map((name) => {
    const file = join(dir, name);
    const slug = check(
      slugSchema,
      basename(name, ".mdx"),
      `${file} (file name)`,
    );
    const frontmatter = check(
      projectFrontmatterSchema,
      readFrontmatter(readFileSync(file, "utf8"), file),
      file,
    );
    return { slug, ...frontmatter };
  });

  const seen = new Map<number, string>();
  for (const project of projects) {
    const other = seen.get(project.order);
    if (other) {
      throw new ContentError(
        `Invalid content: projects "${other}" and "${project.slug}" share order ${project.order}.`,
      );
    }
    seen.set(project.order, project.slug);
  }

  return projects.sort((a, b) => a.order - b.order);
}

export interface Content {
  profile: Profile;
  experience: Experience;
  home: Home;
  work: Work;
  about: About;
  contact: Contact;
  projects: ProjectSummary[];
}

export function loadContent(dir: string = PROJECTS_DIR): Content {
  return {
    profile: check(profileSchema, profile, "content/profile.ts"),
    experience: check(experienceSchema, experience, "content/experience.ts"),
    home: check(homeSchema, home, "content/home.ts"),
    work: check(workSchema, work, "content/work.ts"),
    about: check(aboutSchema, about, "content/about.ts"),
    contact: check(contactSchema, contact, "content/contact.ts"),
    projects: loadProjects(dir),
  };
}

// Static pages plus one case study page per project (D-002).
export const STATIC_PATHS = ["/", "/work", "/about", "/style-tile"] as const;

export function prerenderPaths(dir: string = PROJECTS_DIR): string[] {
  const { projects } = loadContent(dir);
  return [...STATIC_PATHS, ...projects.map(({ slug }) => `/work/${slug}`)];
}
