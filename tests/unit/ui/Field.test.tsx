import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CheckChip,
  Field,
  controlStyles,
  fieldDescribedBy,
} from "~/components/ui";

describe("fieldDescribedBy", () => {
  it("lists the hint, then the error, or nothing", () => {
    expect(fieldDescribedBy("f", true, true)).toBe("f-hint f-error");
    expect(fieldDescribedBy("f", false, true)).toBe("f-error");
    expect(fieldDescribedBy("f", true, false)).toBe("f-hint");
    expect(fieldDescribedBy("f", false, false)).toBeUndefined();
  });
});

describe("Field", () => {
  it("labels its control and describes it with the hint and error", () => {
    render(
      <Field id="qty" label="Quantity" hint="Digits only." error="Too big.">
        <input
          id="qty"
          aria-invalid
          aria-describedby={fieldDescribedBy("qty", true, true)}
          className={controlStyles}
        />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Quantity" });
    expect(input).toHaveAccessibleDescription("Digits only. Too big.");
    expect(input).toBeInvalid();
    // The error has a mark beside the text, not color alone.
    expect(
      screen.getByText("Too big.").querySelector("svg[aria-hidden]"),
    ).not.toBeNull();
  });

  it("renders no hint or error when none is given", () => {
    const { container } = render(
      <Field id="t" label="Title">
        <input id="t" />
      </Field>,
    );
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("CheckChip", () => {
  it("is a labelled checkbox that toggles", () => {
    render(<CheckChip label="Approved" defaultChecked />);
    const box = screen.getByRole("checkbox", { name: "Approved" });
    expect(box).toBeChecked();
    fireEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it("passes disabled to the checkbox", () => {
    render(<CheckChip label="Archived" disabled />);
    expect(screen.getByRole("checkbox", { name: "Archived" })).toBeDisabled();
  });
});
