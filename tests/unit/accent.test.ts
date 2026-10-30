import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCENT_STORAGE_KEY,
  ACCENTS,
  accentScript,
  currentAccent,
  DEFAULT_ACCENT,
  prePaintScript,
  readAccentParam,
  readStoredAccent,
  resolveAccent,
  setAccent,
  subscribeAccent,
} from "~/lib/accent";
import { themeScript } from "~/lib/theme";

import { site } from "../../content/site";

// Accent colors (T-046): the pre-paint script, the `?accent=` parameter,
// storage and the store the palettes read. Contrast per accent and theme is
// checked in theme-tokens.test.ts.

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete html.dataset.accent;
  // The theme script reads the system preference; jsdom has no matchMedia.
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function visit(search: string) {
  window.history.replaceState(null, "", `/${search}`);
}

function runAccentScript() {
  new Function(accentScript)();
  return html.dataset.accent;
}

function blockStorage() {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
}

describe("accents", () => {
  it("offers six accents with green as the default", () => {
    expect(ACCENTS).toEqual([
      "green",
      "purple",
      "gold",
      "red",
      "blue",
      "orange",
    ]);
    expect(DEFAULT_ACCENT).toBe("green");
  });

  it("names every accent in content, in the same order", () => {
    expect(Object.keys(site.accents.names)).toEqual([...ACCENTS]);
  });
});

describe("pre-paint script", () => {
  it("defaults to green", () => {
    expect(runAccentScript()).toBe("green");
  });

  it("uses the stored choice", () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, "gold");
    expect(runAccentScript()).toBe("gold");
  });

  it("ignores an unknown stored value", () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, "pink");
    expect(runAccentScript()).toBe("green");
  });

  it("prefers the parameter over the stored choice and stores it", () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, "gold");
    visit("?accent=blue");
    expect(runAccentScript()).toBe("blue");
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe("blue");
  });

  it("ignores an unknown parameter", () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, "red");
    visit("?accent=pink");
    expect(runAccentScript()).toBe("red");
    expect(localStorage.getItem(ACCENT_STORAGE_KEY)).toBe("red");
  });

  it("still applies the parameter and the default when storage is blocked", () => {
    blockStorage();
    visit("?accent=orange");
    expect(runAccentScript()).toBe("orange");
    visit("");
    expect(runAccentScript()).toBe("green");
  });

  it("runs after the theme script in one inline script", () => {
    expect(prePaintScript).toBe(`${themeScript};${accentScript}`);
    new Function(prePaintScript)();
    expect(html.dataset.theme).toBe("light");
    expect(html.dataset.accent).toBe("green");
  });
});

describe("accent store", () => {
  it("reads the parameter", () => {
    expect(readAccentParam("?accent=purple")).toBe("purple");
    expect(readAccentParam("?accent=pink")).toBeNull();
    expect(readAccentParam("")).toBeNull();
  });

  it("resolves in the same order as the pre-paint script", () => {
    expect(resolveAccent("")).toBe("green");
    localStorage.setItem(ACCENT_STORAGE_KEY, "red");
    expect(resolveAccent("")).toBe("red");
    expect(resolveAccent("?accent=blue")).toBe("blue");
  });

  it("sets, stores and notifies", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAccent(listener);
    setAccent("orange");
    expect(html.dataset.accent).toBe("orange");
    expect(currentAccent()).toBe("orange");
    expect(readStoredAccent()).toBe("orange");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setAccent("green");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("falls back to green for a missing or unknown attribute", () => {
    expect(currentAccent()).toBe("green");
    html.dataset.accent = "pink";
    expect(currentAccent()).toBe("green");
  });

  it("still applies the choice when storage is blocked", () => {
    blockStorage();
    setAccent("purple");
    expect(html.dataset.accent).toBe("purple");
    expect(readStoredAccent()).toBeNull();
  });
});
