import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectObject } from "~/components/three/ProjectObject";

const props = {
  kind: "airplane" as const,
  label: "A 3D model of an airplane",
  hint: "Drag or use the arrow keys to rotate.",
  fallback: "This browser cannot show the 3D model.",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProjectObject (T-034)", () => {
  it("renders a named, focusable image described by the rotation hint", () => {
    render(<ProjectObject {...props} />);
    const stage = screen.getByRole("img", { name: props.label });
    expect(stage).toHaveAttribute("tabindex", "0");
    expect(stage).toHaveAccessibleDescription(props.hint);
    expect(screen.getByRole("figure")).toContainElement(stage);
    // Nothing is loaded until the object scrolls into view.
    expect(stage.querySelector("canvas")).toBeNull();
    expect(stage).not.toHaveAttribute("data-loading");
  });

  it("says so, and leaves the tab order, when WebGL is missing", () => {
    // An observer that reports the object as visible at once.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          private readonly callback: (
            entries: { isIntersecting: boolean }[],
          ) => void,
        ) {}
        observe() {
          this.callback([{ isIntersecting: true }]);
        }
        disconnect() {}
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<ProjectObject {...props} />);
    const stage = screen.getByRole("img", { name: props.label });
    expect(stage).not.toHaveAttribute("tabindex");
    expect(stage).toHaveAccessibleDescription(props.fallback);
  });
});
