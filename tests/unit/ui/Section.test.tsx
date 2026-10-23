import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section } from "~/components/ui";

describe("Section", () => {
  it("is a region labelled by its heading", () => {
    render(
      <Section title="Selected work" eyebrow="Work" intro="Four platforms.">
        <p>Body</p>
      </Section>,
    );
    const region = screen.getByRole("region", { name: "Selected work" });
    expect(region).toContainElement(screen.getByText("Body"));
    expect(
      screen.getByRole("heading", { level: 2, name: "Selected work" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Four platforms.")).toBeInTheDocument();
  });

  it("supports a level 3 heading and passes attributes through", () => {
    render(<Section title="Colors" headingLevel={3} data-theme="dark" />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Colors" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Colors" })).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });
});
