import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { formatYearMonth } from "~/lib/date";
import About, { meta } from "~/routes/about";

import { about } from "../../content/about";
import { experience } from "../../content/experience";
import { profile } from "../../content/profile";
import { aboutSchema } from "../../content/schema";
import type { Route } from "../../app/routes/+types/about";

function renderAbout() {
  return render(
    <MemoryRouter>
      <About />
    </MemoryRouter>,
  );
}

describe("About route", () => {
  it("has one top-level heading and a region per section", () => {
    renderAbout();
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual([about.header.title]);
    for (const name of [
      about.story.title,
      about.experience.title,
      about.skills.title,
      about.education.title,
    ]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
  });

  it("tells the story from profile.ts", () => {
    renderAbout();
    const region = screen.getByRole("region", { name: about.story.title });
    for (const paragraph of profile.story) {
      expect(within(region).getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("lists the experience timeline in order, with machine-readable dates", () => {
    renderAbout();
    const region = screen.getByRole("region", { name: about.experience.title });
    // The timeline is the first list; each entry may nest a highlights list.
    const [timeline] = within(region).getAllByRole("list");
    const entries = Array.from(
      timeline?.querySelectorAll<HTMLElement>(":scope > li") ?? [],
    );
    expect(entries).toHaveLength(experience.length);
    experience.forEach((entry, index) => {
      const item = within(entries[index]);
      expect(
        item.getByRole("heading", { level: 3, name: entry.role }),
      ).toBeInTheDocument();
      expect(item.getByText(entry.organization)).toBeInTheDocument();
      expect(
        item.getByText(formatYearMonth(entry.start)).closest("time"),
      ).toHaveAttribute("dateTime", entry.start);
      if (entry.end === null) {
        expect(entries[index]).toHaveTextContent(about.experience.present);
      }
      for (const highlight of entry.highlights) {
        expect(item.getByText(highlight)).toBeInTheDocument();
      }
    });
  });

  it("shows every skill group and education entry", () => {
    renderAbout();
    const skills = screen.getByRole("region", { name: about.skills.title });
    for (const group of profile.skills) {
      expect(
        within(skills).getByRole("heading", { name: group.group }),
      ).toBeInTheDocument();
      for (const item of group.items) {
        expect(within(skills).getByText(item)).toBeInTheDocument();
      }
    }
    const education = screen.getByRole("region", {
      name: about.education.title,
    });
    for (const entry of profile.education) {
      expect(
        within(education).getByRole("heading", {
          name: `${entry.degree}, ${entry.field}`,
        }),
      ).toBeInTheDocument();
      expect(
        within(education).getByText(entry.institution),
      ).toBeInTheDocument();
    }
  });

  it("links onward from content", () => {
    renderAbout();
    for (const link of about.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }
  });
});

describe("About meta", () => {
  it("sets the title, description, canonical URL and Open Graph tags", () => {
    const tags = meta({} as Route.MetaArgs);
    expect(tags).toContainEqual({ title: about.meta.title });
    expect(tags).toContainEqual({
      name: "description",
      content: about.meta.description,
    });
    expect(tags).toContainEqual(
      expect.objectContaining({
        rel: "canonical",
        href: expect.stringMatching(/\/about$/),
      }),
    );
    expect(tags).toContainEqual({
      property: "og:title",
      content: about.meta.title,
    });
  });
});

describe("formatYearMonth", () => {
  it("formats a month without depending on the time zone", () => {
    expect(formatYearMonth("2024-08")).toBe("Aug 2024");
    expect(formatYearMonth("2026-01")).toBe("Jan 2026");
  });
});

describe("about content validation", () => {
  it("is valid", () => {
    expect(aboutSchema.safeParse(about).success).toBe(true);
  });

  it("rejects unknown keys and unsafe links", () => {
    expect(
      aboutSchema.safeParse({ ...about, story: { title: "x", extra: "y" } })
        .success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...about,
        links: [{ label: "Bad", href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
});
