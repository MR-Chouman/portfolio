import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { WorkRow } from "~/components/ui";

const project = {
  href: "/work/crew-platform",
  title: "Airline crew management platform",
  sector: "Aviation",
  summary: "Rostering and training in one admin platform.",
  metric: "25 modules",
  stack: ["Next.js", "TypeScript"],
  linkLabel: "Read the case study",
};

function renderRow(
  props: Partial<typeof project & { headingLevel: 2 | 3 | 4 }> = {},
) {
  return render(
    <MemoryRouter>
      <WorkRow {...project} {...props} />
    </MemoryRouter>,
  );
}

describe("WorkRow", () => {
  it("has a single link, named by the project title", () => {
    renderRow();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(project.title);
    expect(links[0]).toHaveAttribute("href", project.href);
  });

  it("shows sector, summary, metric and stack", () => {
    renderRow();
    for (const text of [project.sector, project.summary, project.metric]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("uses the requested heading level", () => {
    renderRow({ headingLevel: 2 });
    expect(
      screen.getByRole("heading", { level: 2, name: project.title }),
    ).toBeInTheDocument();
  });
});
