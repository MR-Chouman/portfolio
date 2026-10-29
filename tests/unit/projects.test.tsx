import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getProject, projects } from "~/lib/projects";
import CaseStudy from "~/routes/work.$slug";

import { loadProjects } from "../../content/load";
import type { Route } from "../../app/routes/+types/work.$slug";

describe("project loader", () => {
  it("matches the frontmatter validated at build time", () => {
    // The MDX pipeline (remark-mdx-frontmatter) and content/load.ts must read
    // the same YAML the same way.
    expect(projects).toEqual(loadProjects());
  });

  it("returns a project with its MDX content by slug", () => {
    const [first] = projects;
    const project = getProject(first.slug);
    expect(project?.title).toBe(first.title);
    expect(typeof project?.Content).toBe("function");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("not-a-project")).toBeUndefined();
  });
});

describe("case study route", () => {
  const props = (slug: string) =>
    ({ params: { slug } }) as unknown as Route.ComponentProps;

  it("renders the project header and its MDX body", () => {
    const [first] = projects;
    const { container } = render(<CaseStudy {...props(first.slug)} />);
    expect(
      screen.getByRole("heading", { level: 1, name: first.title }),
    ).toBeInTheDocument();
    expect(container.querySelector(".prose-content")?.textContent).not.toBe("");
  });

  it("throws a 404 for an unknown slug", () => {
    expect(() => render(<CaseStudy {...props("not-a-project")} />)).toThrow();
  });
});
