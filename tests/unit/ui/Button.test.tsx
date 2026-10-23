import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonLink, buttonStyles } from "~/components/ui";

describe("Button", () => {
  it("is a non-submitting button by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("calls onClick, and not when disabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant and size styles and appends className", () => {
    render(
      <Button variant="secondary" size="sm" className="w-full">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-fg-muted", "h-9", "w-full");
  });

  it("defaults to the primary, medium style", () => {
    expect(buttonStyles()).toContain("bg-accent");
    expect(buttonStyles()).toContain("h-11");
  });
});

describe("ButtonLink", () => {
  it("renders a link styled as a button", () => {
    render(
      <MemoryRouter>
        <ButtonLink href="/work" variant="secondary">
          View work
        </ButtonLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "View work" });
    expect(link).toHaveAttribute("href", "/work");
    expect(link).toHaveClass("border-fg-muted");
  });
});
