import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag, TagList } from "~/components/ui";

describe("Tag", () => {
  it("renders its label with the chosen tone", () => {
    render(<Tag tone="accent">Lead</Tag>);
    expect(screen.getByText("Lead")).toHaveClass("text-accent");
  });
});

describe("TagList", () => {
  it("renders the items as a list", () => {
    render(<TagList items={["React", "Tailwind CSS"]} />);
    const list = screen.getByRole("list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["React", "Tailwind CSS"]);
  });
});
