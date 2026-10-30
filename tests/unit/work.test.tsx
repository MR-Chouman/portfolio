import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { projects } from "~/lib/projects";
import WorkIndex, { meta } from "~/routes/work";

import { workSchema } from "../../content/schema";
import { work } from "../../content/work";
import type { Route } from "../../app/routes/+types/work";

function renderIndex() {
  return render(
    <MemoryRouter>
      <WorkIndex />
    </MemoryRouter>,
  );
}

describe("Work index route", () => {
  it("has one top-level heading", () => {
    renderIndex();
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual([work.index.title]);
  });

  it("lists every project in display order, linked to its case study", () => {
    renderIndex();
    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(projects.map((project) => project.title));
    for (const project of projects) {
      expect(screen.getByRole("link", { name: project.title })).toHaveAttribute(
        "href",
        `/work/${project.slug}`,
      );
    }
  });
});

describe("Work index meta", () => {
  it("sets the title, description, canonical URL and Open Graph tags", () => {
    const tags = meta({} as Route.MetaArgs);
    expect(tags).toContainEqual({ title: work.meta.title });
    expect(tags).toContainEqual({
      name: "description",
      content: work.meta.description,
    });
    expect(tags).toContainEqual(
      expect.objectContaining({
        rel: "canonical",
        href: expect.stringMatching(/\/work\/$/),
      }),
    );
    expect(tags).toContainEqual({
      property: "og:title",
      content: work.meta.title,
    });
  });
});

describe("work content validation", () => {
  it("is valid", () => {
    expect(workSchema.safeParse(work).success).toBe(true);
  });

  it("rejects unknown keys and unsafe links", () => {
    expect(
      workSchema.safeParse({ ...work, index: { ...work.index, extra: "x" } })
        .success,
    ).toBe(false);
    expect(
      workSchema.safeParse({
        ...work,
        caseStudy: {
          ...work.caseStudy,
          back: { label: "Back", href: "javascript:alert(1)" },
        },
      }).success,
    ).toBe(false);
  });
});
