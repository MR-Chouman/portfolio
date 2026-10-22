import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "~/routes/home";

describe("Home route", () => {
  it("renders a single top-level heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
