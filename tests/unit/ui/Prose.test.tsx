import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Prose } from "~/components/ui";

describe("Prose", () => {
  it("wraps content in the prose styles", () => {
    render(
      <Prose className="mt-8">
        <p>Paragraph</p>
      </Prose>,
    );
    expect(screen.getByText("Paragraph").parentElement).toHaveClass(
      "prose-content",
      "mt-8",
    );
  });
});
