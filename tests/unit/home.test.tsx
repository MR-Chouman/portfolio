import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { projects } from "~/lib/projects";
import Home, { meta } from "~/routes/home";

import { contact } from "../../content/contact";
import { home } from "../../content/home";
import { profile } from "../../content/profile";
import { homeSchema } from "../../content/schema";
import type { Route } from "../../app/routes/+types/home";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe("Home route", () => {
  it("renders the headline as the only top-level heading", () => {
    renderHome();
    const [h1] = screen.getAllByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(h1).toHaveTextContent(profile.headline);
  });

  it("has a labelled region for every section", () => {
    renderHome();
    for (const name of [
      home.metrics.title,
      home.work.title,
      home.approach.title,
      home.about.title,
      home.contact.title,
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("shows the profile metrics", () => {
    renderHome();
    const strip = screen.getByRole("region", { name: home.metrics.title });
    for (const metric of profile.metrics) {
      expect(within(strip).getByText(metric.value)).toBeInTheDocument();
      expect(within(strip).getByText(metric.label)).toBeInTheDocument();
    }
  });

  it("links every project to its case study, in display order", () => {
    renderHome();
    const work = screen.getByRole("region", { name: home.work.title });
    const titles = within(work)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(projects.map((project) => project.title));
    for (const project of projects) {
      expect(
        within(work).getByRole("link", { name: project.title }),
      ).toHaveAttribute("href", `/work/${project.slug}`);
    }
  });

  it("points the hero actions at sections on the page", () => {
    const { container } = renderHome();
    for (const action of home.hero.actions) {
      const link = screen.getByRole("link", { name: action.label });
      expect(link).toHaveAttribute("href", action.href);
      if (action.href.startsWith("#")) {
        expect(container.querySelector(action.href)).not.toBeNull();
      }
    }
  });

  it("links the email, the CV download and the GitHub profile only", () => {
    renderHome();
    const region = screen.getByRole("region", { name: home.contact.title });
    expect(
      within(region).getByRole("link", { name: /^Email / }),
    ).toHaveAttribute("href", `mailto:${contact.email.address}`);
    const cv = within(region).getByRole("link", {
      name: new RegExp(contact.cv.label),
    });
    expect(cv).toHaveAttribute("href", contact.cv.href);
    expect(cv).toHaveAttribute("download", contact.cv.fileName);
    expect(
      within(region).getByRole("link", { name: contact.github.label }),
    ).toHaveAttribute("href", contact.github.href);
    expect(within(region).getAllByRole("link")).toHaveLength(3);
  });

  it("fills the contact card like the About card", () => {
    renderHome();
    const card = screen.getByRole("region", { name: home.contact.title });
    const about = screen.getByRole("region", { name: home.about.title });
    expect(card).toHaveClass("bg-surface-raised", "border-line");
    expect(about).toHaveClass("bg-surface-raised", "border-line");
  });
});

describe("Home meta", () => {
  it("sets the title, description, canonical URL and Open Graph tags", () => {
    const tags = meta({} as Route.MetaArgs);
    expect(tags).toContainEqual({ title: home.meta.title });
    expect(tags).toContainEqual({
      name: "description",
      content: home.meta.description,
    });
    expect(tags).toContainEqual(
      expect.objectContaining({ rel: "canonical", href: expect.any(String) }),
    );
    expect(tags).toContainEqual({
      property: "og:title",
      content: home.meta.title,
    });
  });
});

describe("home content validation", () => {
  it("rejects links that are neither site paths, anchors nor https URLs", () => {
    for (const href of ["javascript:alert(1)", "//evil.example", "http://x"]) {
      const result = homeSchema.safeParse({
        ...home,
        about: { ...home.about, link: { label: "More", href } },
      });
      expect(result.success, href).toBe(false);
    }
  });

  it("rejects unknown keys", () => {
    expect(
      homeSchema.safeParse({ ...home, hero: { ...home.hero, title: "x" } })
        .success,
    ).toBe(false);
  });
});
