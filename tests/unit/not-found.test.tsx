import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { NotFound } from "~/components/sections/NotFound";
import { ErrorBoundary, meta as rootMeta } from "~/root";
import NotFoundRoute, { meta } from "~/routes/not-found";

import { notFound } from "../../content/not-found";
import { notFoundSchema } from "../../content/schema";
import type { Route } from "../../app/+types/root";

function inRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const notFoundResponse = {
  status: 404,
  statusText: "Not Found",
  internal: false,
  data: null,
};

describe("404 page", () => {
  it("has one top-level heading and links to the main pages", () => {
    inRouter(<NotFoundRoute />);
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual([notFound.title]);
    for (const link of notFound.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }
  });

  it("sets its title and noindex, without a canonical URL", () => {
    const tags = meta();
    expect(tags).toContainEqual({ title: notFound.meta.title });
    expect(tags).toContainEqual({ name: "robots", content: "noindex" });
    expect(tags.some((tag) => "rel" in tag)).toBe(false);
  });
});

describe("root error boundary", () => {
  function renderBoundary(error: unknown) {
    return inRouter(
      <ErrorBoundary
        {...({ error, params: {} } as unknown as Route.ErrorBoundaryProps)}
      />,
    );
  }

  it("renders the 404 page for a 404 response", () => {
    const { container } = renderBoundary(notFoundResponse);
    const expected = inRouter(<NotFound />).container;
    expect(container.innerHTML).toBe(expected.innerHTML);
  });

  it("renders the error copy for any other error", () => {
    renderBoundary(new Error("boom"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      notFound.error.title,
    );
    expect(
      screen.getByRole("link", { name: notFound.error.link.label }),
    ).toHaveAttribute("href", notFound.error.link.href);
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("gives error pages a title and noindex, and other pages nothing", () => {
    const call = (error: unknown) =>
      rootMeta({ error } as unknown as Route.MetaArgs);
    expect(call(undefined)).toEqual([]);
    expect(call(notFoundResponse)).toEqual(meta());
    expect(call(new Error("boom"))).toContainEqual({
      name: "robots",
      content: "noindex",
    });
  });
});

describe("notFoundSchema", () => {
  it("accepts the shipped copy", () => {
    expect(notFoundSchema.safeParse(notFound).success).toBe(true);
  });

  it("rejects unknown keys and unsafe links", () => {
    expect(
      notFoundSchema.safeParse({ ...notFound, extra: "typo" }).success,
    ).toBe(false);
    expect(
      notFoundSchema.safeParse({
        ...notFound,
        links: [{ label: "Bad", href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
});
