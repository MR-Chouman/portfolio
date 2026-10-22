import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Metric, MetricList } from "~/components/ui";

describe("Metric", () => {
  it("pairs each label with its value in a description list", () => {
    render(
      <MetricList>
        <Metric value="260+" label="Admin screens" />
        <Metric value="4" label="Platforms" />
      </MetricList>,
    );
    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    const values = screen
      .getAllByRole("definition")
      .map((value) => value.textContent);
    expect(terms).toEqual(["Admin screens", "Platforms"]);
    expect(values).toEqual(["260+", "4"]);
  });
});
