import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { notFoundMeta } from "~/components/sections/NotFound";
import { getNextProject, getProject, projects } from "~/lib/projects";
import CaseStudy, { meta } from "~/routes/work.$slug";

import { loadProjects } from "../../content/load";
import { notFound } from "../../content/not-found";
import { work } from "../../content/work";
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

  it("finds the next project in display order, wrapping to the first", () => {
    expect(projects.length).toBeGreaterThan(1);
    for (const [index, project] of projects.entries()) {
      expect(getNextProject(project.slug)).toBe(
        projects[(index + 1) % projects.length],
      );
    }
    expect(getNextProject("not-a-project")).toBeUndefined();
  });
});

describe("case study route", () => {
  const props = (slug: string) =>
    ({ params: { slug } }) as unknown as Route.ComponentProps;

  function renderCaseStudy(slug: string) {
    return render(
      <MemoryRouter>
        <CaseStudy {...props(slug)} />
      </MemoryRouter>,
    );
  }

  it("renders the summary header with role, stack and metrics", () => {
    const [first] = projects;
    renderCaseStudy(first.slug);
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual([first.title]);
    expect(screen.getByText(first.summary)).toBeInTheDocument();
    expect(screen.getByText(first.role)).toBeInTheDocument();
    for (const item of first.stack) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    const metrics = screen.getByRole("region", {
      name: work.caseStudy.metrics,
    });
    for (const metric of first.metrics) {
      expect(within(metrics).getByText(metric.value)).toBeInTheDocument();
    }
  });

  it("renders the MDX body sections", () => {
    const [first] = projects;
    const { container } = renderCaseStudy(first.slug);
    const body = container.querySelector(".prose-content");
    expect(body?.querySelectorAll("h2").length).toBeGreaterThan(0);
  });

  it("links back to the index and on to the next project", () => {
    for (const project of projects) {
      const next = getNextProject(project.slug);
      const { unmount } = renderCaseStudy(project.slug);
      const nav = screen.getByRole("navigation", {
        name: work.caseStudy.navigationLabel,
      });
      expect(
        within(nav).getByRole("link", {
          name: `${work.caseStudy.next}: ${next?.title}`,
        }),
      ).toHaveAttribute("href", `/work/${next?.slug}`);
      for (const link of screen.getAllByRole("link", {
        name: new RegExp(work.caseStudy.back.label),
      })) {
        expect(link).toHaveAttribute("href", work.caseStudy.back.href);
      }
      unmount();
    }
  });

  it("renders the 404 page for an unknown slug", () => {
    renderCaseStudy("not-a-project");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      notFound.title,
    );
  });
});

describe("case study meta", () => {
  it("gives each project its own title, canonical URL and article type", () => {
    const titles = new Set<string>();
    for (const project of projects) {
      const tags = meta({
        params: { slug: project.slug },
      } as unknown as Route.MetaArgs);
      const title = tags
        .map((tag) => ("title" in tag ? String(tag.title) : undefined))
        .find(Boolean);
      expect(title).toContain(project.title);
      titles.add(title ?? "");
      expect(tags).toContainEqual({
        property: "og:description",
        content: project.summary,
      });
      expect(tags).toContainEqual({ property: "og:type", content: "article" });
      expect(tags).toContainEqual(
        expect.objectContaining({
          rel: "canonical",
          href: expect.stringMatching(new RegExp(`/work/${project.slug}$`)),
        }),
      );
    }
    expect(titles.size).toBe(projects.length);
  });

  it("returns the 404 page's tags for an unknown slug", () => {
    expect(
      meta({ params: { slug: "nope" } } as unknown as Route.MetaArgs),
    ).toEqual(notFoundMeta());
  });
});
