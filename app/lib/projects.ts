import type { MDXContent } from "mdx/types";

import type { ProjectSummary } from "../../content/schema";

// Case studies from content/projects/*.mdx (T-020). Frontmatter was validated
// by content/load.ts at build time, so it is typed here without Zod, which
// stays out of the client bundle (D-025).
interface ProjectModule {
  default: MDXContent;
  frontmatter: Omit<ProjectSummary, "slug">;
}

const modules = import.meta.glob<ProjectModule>(
  "../../content/projects/*.mdx",
  { eager: true },
);

function slugOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1, -".mdx".length);
}

const entries = Object.entries(modules)
  .map(([path, module]) => ({
    summary: { slug: slugOf(path), ...module.frontmatter },
    Content: module.default,
  }))
  .sort((a, b) => a.summary.order - b.summary.order);

// Every project's frontmatter, in display order.
export const projects: ProjectSummary[] = entries.map(({ summary }) => summary);

export interface Project extends ProjectSummary {
  Content: MDXContent;
}

export function getProject(slug: string): Project | undefined {
  const entry = entries.find(({ summary }) => summary.slug === slug);
  return entry && { ...entry.summary, Content: entry.Content };
}

// The project after `slug` in display order, wrapping from the last to the
// first, for the "Next project" link of a case study (T-022).
export function getNextProject(slug: string): ProjectSummary | undefined {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1 || projects.length < 2) return undefined;
  return projects[(index + 1) % projects.length];
}
