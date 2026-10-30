import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccentPalette } from "~/components/layout/AccentPalette";
import { ACCENT_STORAGE_KEY, ACCENTS, setAccent } from "~/lib/accent";

import { site } from "../../content/site";

// The floating accent palette (T-047): a labelled radio group of the six
// accents, with a tab that opens it on phones. Layout and the tablet rail
// are checked in tests/e2e/accent-palette.spec.ts, since jsdom has no CSS.

const html = document.documentElement;
const names = site.accents.names;

beforeEach(() => {
  localStorage.clear();
  html.dataset.accent = "green";
});

afterEach(() => {
  delete html.dataset.accent;
});

function tab() {
  return screen.getByRole("button", { name: /^Accent color/ });
}

describe("AccentPalette", () => {
  it("is a labelled radio group with one named radio per accent, in order", () => {
    render(<AccentPalette />);
    const group = screen.getByRole("radiogroup", {
      name: site.accents.label,
      hidden: true,
    });
    const radios = screen.getAllByRole("radio", { hidden: true });
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      ...ACCENTS,
    ]);
    for (const accent of ACCENTS) {
      expect(
        screen.getByRole("radio", { name: names[accent], hidden: true }),
      ).toBeTruthy();
    }
    radios.forEach((radio) => expect(group.contains(radio)).toBe(true));
  });

  it("checks the current accent and follows changes made elsewhere", () => {
    render(<AccentPalette />);
    const radio = (accent: string) =>
      screen.getByRole<HTMLInputElement>("radio", {
        name: accent,
        hidden: true,
      });
    expect(radio(names.green).checked).toBe(true);
    act(() => setAccent("blue"));
    expect(radio(names.blue).checked).toBe(true);
    expect(radio(names.green).checked).toBe(false);
  });

  it("applies, stores and announces a choice", () => {
    render(<AccentPalette />);
    fireEvent.click(
      screen.getByRole("radio", { name: names.purple, hidden: true }),
    );
    expect(html.dataset.accent).toBe("purple");
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe("purple");
    expect(screen.getByRole("status").textContent).toBe(
      `${names.purple} ${site.accents.on}`,
    );
  });

  it("names the phone tab after the current accent", () => {
    render(<AccentPalette />);
    expect(tab().getAttribute("aria-label")).toBe(
      `${site.accents.label}: ${names.green}`,
    );
    act(() => setAccent("gold"));
    expect(tab().getAttribute("aria-label")).toBe(
      `${site.accents.label}: ${names.gold}`,
    );
  });

  it("opens and closes the group from the phone tab", () => {
    render(<AccentPalette />);
    const group = screen.getByRole("radiogroup", { hidden: true });
    expect(tab().getAttribute("aria-expanded")).toBe("false");
    expect(tab().getAttribute("aria-controls")).toBe(group.id);
    expect(group.className).toMatch(/(^| )hidden( |$)/);

    fireEvent.click(tab());
    expect(tab().getAttribute("aria-expanded")).toBe("true");
    expect(group.className).not.toMatch(/(^| )hidden( |$)/);

    fireEvent.click(tab());
    expect(tab().getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape and returns focus to the tab", () => {
    render(<AccentPalette />);
    fireEvent.click(tab());
    const radio = screen.getByRole("radio", { name: names.green });
    radio.focus();
    fireEvent.keyDown(radio, { key: "Escape" });
    expect(tab().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(tab());
  });

  it("closes on a pointer press outside", () => {
    render(
      <>
        <AccentPalette />
        <p>Outside</p>
      </>,
    );
    fireEvent.click(tab());
    fireEvent.pointerDown(screen.getByText("Outside"));
    expect(tab().getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when focus moves outside, not when a press blurs the tab", () => {
    render(
      <>
        <AccentPalette />
        <button type="button">Outside</button>
      </>,
    );
    fireEvent.click(tab());
    // A press on a swatch blurs the tab with no new focus target.
    fireEvent.focusOut(tab(), { relatedTarget: null });
    expect(tab().getAttribute("aria-expanded")).toBe("true");
    fireEvent.focusOut(tab(), {
      relatedTarget: screen.getByRole("button", { name: "Outside" }),
    });
    expect(tab().getAttribute("aria-expanded")).toBe("false");
  });

  it("is disabled until the accent is known", () => {
    delete html.dataset.accent;
    // useAccent reads <html>; the server snapshot is null, which
    // renderToString uses.
    return import("react-dom/server").then(({ renderToString }) => {
      const markup = renderToString(<AccentPalette />);
      const container = document.createElement("div");
      container.innerHTML = markup;
      const radios = container.querySelectorAll("input[type=radio]");
      expect(radios).toHaveLength(ACCENTS.length);
      radios.forEach((radio) => {
        expect(radio.hasAttribute("disabled")).toBe(true);
        expect(radio.hasAttribute("checked")).toBe(false);
      });
      expect(container.querySelector("button")?.hasAttribute("disabled")).toBe(
        true,
      );
    });
  });
});
