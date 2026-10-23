import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { Link, isInternalHref } from "~/components/ui";

describe("isInternalHref", () => {
  it.each([
    ["/", true],
    ["/work", true],
    ["/work/crew-platform?tab=1#outcome", true],
    ["/cv.pdf", false],
    ["//example.com", false],
    ["https://github.com/MR-Chouman", false],
    ["mailto:someone@example.com", false],
    ["#main", false],
  ])("%s -> %s", (href, internal) => {
    expect(isInternalHref(href)).toBe(internal);
  });
});

describe("Link", () => {
  it("renders internal and external links with the right href", () => {
    render(
      <MemoryRouter>
        <Link href="/about">About</Link>
        <Link href="https://example.com" variant="muted">
          Elsewhere
        </Link>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    const external = screen.getByRole("link", { name: "Elsewhere" });
    expect(external).toHaveAttribute("href", "https://example.com");
    expect(external).toHaveClass("text-fg-muted");
  });

  it("uses the accent style by default", () => {
    render(<Link href="#top">Top</Link>);
    expect(screen.getByRole("link", { name: "Top" })).toHaveClass(
      "text-accent",
    );
  });
});
