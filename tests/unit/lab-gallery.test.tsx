import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { ComponentGallery } from "~/components/lab/ComponentGallery";
import { ACCENTS } from "~/lib/accent";

import { lab } from "../../content/lab";
import { labSchema } from "../../content/schema";
import { site } from "../../content/site";

const copy = lab.gallery;

// Links need a router.
function renderGallery() {
  const Stub = createRoutesStub([
    { path: "/lab", Component: () => <ComponentGallery /> },
  ]);
  return render(<Stub initialEntries={["/lab"]} />);
}

function panels() {
  return (["light", "dark"] as const).map((theme) => {
    const panel = screen.getByRole("region", { name: copy.themes[theme] });
    return { theme, panel };
  });
}

describe("component gallery copy", () => {
  it("is valid", () => {
    expect(labSchema.safeParse(lab).success).toBe(true);
  });
});

describe("ComponentGallery", () => {
  it("is a titled region with a light and a dark panel", () => {
    renderGallery();
    expect(screen.getByRole("region", { name: copy.title })).toHaveAttribute(
      "id",
      "component-gallery",
    );
    for (const { theme, panel } of panels()) {
      expect(panel).toHaveAttribute("data-theme", theme);
    }
  });

  it("shows every block in both panels", () => {
    renderGallery();
    for (const { panel } of panels()) {
      for (const block of Object.values(copy.blocks)) {
        expect(
          within(panel).getByRole("heading", { level: 4, name: block.title }),
        ).toBeInTheDocument();
      }
    }
  });

  it("shows the button variants and the disabled state", () => {
    renderGallery();
    for (const { panel } of panels()) {
      const publish = within(panel).getAllByRole("button", {
        name: copy.samples.buttons.primary,
      });
      expect(publish.map((button) => button.hasAttribute("disabled"))).toEqual([
        false,
        true,
      ]);
      for (const name of ["secondary", "ghost", "small"] as const) {
        expect(
          within(panel).getByRole("button", {
            name: copy.samples.buttons[name],
          }),
        ).toBeEnabled();
      }
      expect(
        within(panel).getByRole("link", { name: copy.samples.buttons.link }),
      ).toHaveAttribute("href", "/work");
    }
  });

  it("shows field states with unique ids per panel", () => {
    renderGallery();
    const { fields } = copy.samples;
    const ids = new Set<string>();
    for (const { panel } of panels()) {
      const hint = within(panel).getByRole("textbox", {
        name: fields.hint.label,
      });
      expect(hint).toHaveAccessibleDescription(fields.hint.hint);
      const invalid = within(panel).getByRole("textbox", {
        name: fields.invalid.label,
      });
      expect(invalid).toBeInvalid();
      expect(invalid).toHaveAccessibleDescription(fields.invalid.error);
      expect(
        within(panel).getByRole("textbox", { name: fields.disabled.label }),
      ).toBeDisabled();
      expect(
        within(panel).getByRole("combobox", { name: fields.select.label }),
      ).toHaveValue("machinery");
      for (const input of within(panel).getAllByRole("textbox"))
        ids.add(input.id);
    }
    expect(ids.size).toBe(8);
  });

  it("shows chip states and every status", () => {
    renderGallery();
    const { chips } = copy.samples;
    for (const { panel } of panels()) {
      expect(
        within(panel).getByRole("checkbox", { name: chips.unchecked }),
      ).not.toBeChecked();
      expect(
        within(panel).getByRole("checkbox", { name: chips.checked }),
      ).toBeChecked();
      expect(
        within(panel).getByRole("checkbox", { name: chips.disabled }),
      ).toBeDisabled();
      for (const label of Object.values(lab.table.values.status)) {
        expect(within(panel).getAllByText(label).length).toBeGreaterThan(0);
      }
    }
  });

  it("repeats the accent primitives once per accent in the panel's theme", () => {
    renderGallery();
    for (const { theme, panel } of panels()) {
      for (const accent of ACCENTS) {
        const row = within(panel).getByRole("group", {
          name: `${site.accents.names[accent]} accent`,
        });
        expect(row).toHaveAttribute("data-accent", accent);
        // The theme is set again with the accent, so --accent resolves to
        // this accent's value for the theme (tokens.css).
        expect(row).toHaveAttribute("data-theme", theme);
        const samples = copy.samples.accentSamples;
        within(row).getByRole("button", { name: samples.button });
        within(row).getByRole("link", { name: samples.link });
        within(row).getByText(samples.tag);
        expect(
          within(row).getByRole("checkbox", { name: samples.chip }),
        ).toBeChecked();
      }
    }
  });
});
