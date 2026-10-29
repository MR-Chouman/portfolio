import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Figure } from "~/components/ui";

const props = {
  src: "/images/sample.webp",
  alt: "An invented roster table",
  caption: "Rostering screen with invented data.",
  width: 1200,
  height: 750,
};

describe("Figure", () => {
  it("renders an image with its size and a caption naming the figure", () => {
    render(<Figure {...props} />);
    const figure = screen.getByRole("figure");
    expect(figure.querySelector("figcaption")).toHaveTextContent(props.caption);
    const image = screen.getByRole("img", { name: props.alt });
    expect(figure).toContainElement(image);
    expect(image).toHaveAttribute("width", "1200");
    expect(image).toHaveAttribute("height", "750");
  });

  it("loads lazily unless it is a priority image", () => {
    const { rerender } = render(<Figure {...props} />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
    rerender(<Figure {...props} priority />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
  });
});
