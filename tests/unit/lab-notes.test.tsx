import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { PatternNotes } from "~/components/lab/PatternNotes";
import { LabPage } from "~/routes/lab";

import { lab } from "../../content/lab";
import { SOURCE_REPO, labSchema } from "../../content/schema";

// T-054: the lab explains each pattern and links to its source on GitHub.
const allNotes = [lab.table.notes, lab.crud.notes, lab.gallery.notes];
const allSource = [lab.header.source, ...allNotes.flatMap((n) => n.source)];

const root = resolve(import.meta.dirname, "../..");

function renderWithRouter(element: React.ReactNode) {
  const Stub = createRoutesStub([{ path: "/lab", Component: () => element }]);
  return render(<Stub initialEntries={["/lab"]} />);
}

describe("lab source links", () => {
  it("point at files and folders that exist in this repository", () => {
    for (const { href } of allSource) {
      const [, kind, path] = /\/(blob|tree)\/main\/(.+)$/.exec(href) ?? [];
      expect(path, href).toBeDefined();
      const local = resolve(root, path ?? "");
      expect(existsSync(local), href).toBe(true);
      expect(statSync(local).isDirectory(), href).toBe(kind === "tree");
    }
  });

  it("are unique and all in the site's repository", () => {
    const hrefs = allSource.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs)
      expect(href.startsWith(`${SOURCE_REPO}/`)).toBe(true);
  });

  it("are rejected by the schema when they leave the repository", () => {
    const outside = {
      ...lab,
      header: {
        ...lab.header,
        source: { label: "Elsewhere", href: "https://github.com/other/repo" },
      },
    };
    expect(labSchema.safeParse(lab).success).toBe(true);
    expect(labSchema.safeParse(outside).success).toBe(false);
  });
});

describe("PatternNotes", () => {
  it("is a titled region with the points and the source links", () => {
    const notes = lab.table.notes;
    renderWithRouter(<PatternNotes notes={notes} />);
    const region = screen.getByRole("region", { name: notes.title });
    expect(
      within(region).getByRole("heading", { level: 3, name: notes.title }),
    ).toBeInTheDocument();
    for (const point of notes.points) {
      expect(within(region).getByText(point)).toBeInTheDocument();
    }
    const list = within(region).getByRole("list", { name: notes.sourceTitle });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      notes.source.map((link) => link.href),
    );
    expect(links.map((link) => link.textContent)).toEqual(
      notes.source.map((link) => link.label),
    );
  });
});

describe("the lab page", () => {
  it("links to its source and explains every pattern", () => {
    renderWithRouter(<LabPage data={undefined} />);
    expect(
      screen.getByRole("link", { name: lab.header.source.label }),
    ).toHaveAttribute("href", lab.header.source.href);
    for (const notes of allNotes) {
      expect(
        screen.getByRole("region", { name: notes.title }),
      ).toBeInTheDocument();
    }
  });

  it("places each pattern's notes in its section", () => {
    renderWithRouter(<LabPage data={undefined} />);
    const table = screen.getByRole("region", { name: lab.table.title });
    const gallery = screen.getByRole("region", { name: lab.gallery.title });
    for (const notes of [lab.table.notes, lab.crud.notes]) {
      expect(
        within(table).getByRole("region", { name: notes.title }),
      ).toBeInTheDocument();
    }
    expect(
      within(gallery).getByRole("region", { name: lab.gallery.notes.title }),
    ).toBeInTheDocument();
  });
});
