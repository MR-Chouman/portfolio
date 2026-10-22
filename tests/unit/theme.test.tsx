import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "~/components/layout/ThemeToggle";
import {
  readStoredTheme,
  setTheme,
  subscribeTheme,
  THEME_STORAGE_KEY,
  themeScript,
} from "~/lib/theme";

// jsdom has no matchMedia; this fake lets tests flip the system preferences.
const media = {
  dark: false,
  reducedMotion: false,
  listeners: new Set<() => void>(),
};

function fakeMatchMedia(query: string) {
  return {
    get matches() {
      return query.includes("color-scheme")
        ? media.dark
        : query.includes("reduced-motion") && media.reducedMotion;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      media.listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      media.listeners.delete(listener),
  };
}

function setSystemDark(dark: boolean) {
  media.dark = dark;
  media.listeners.forEach((listener) => listener());
}

const html = document.documentElement;

beforeEach(() => {
  media.dark = false;
  media.reducedMotion = false;
  media.listeners.clear();
  vi.stubGlobal("matchMedia", fakeMatchMedia);
  localStorage.clear();
  delete html.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // jsdom has no View Transitions; remove any stub a test added.
  Reflect.deleteProperty(document, "startViewTransition");
});

function runThemeScript() {
  new Function(themeScript)();
  return html.dataset.theme;
}

function blockStorage() {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
}

describe("pre-paint script", () => {
  it("uses the stored choice over the system preference", () => {
    media.dark = true;
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(runThemeScript()).toBe("light");
  });

  it("falls back to the system preference", () => {
    media.dark = true;
    expect(runThemeScript()).toBe("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(runThemeScript()).toBe("dark");
  });

  it("survives blocked storage", () => {
    blockStorage();
    expect(runThemeScript()).toBe("light");
  });
});

describe("theme store", () => {
  it("reads nothing when storage is blocked", () => {
    blockStorage();
    expect(readStoredTheme()).toBeNull();
  });

  it("applies, stores and announces a choice", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    setTheme("dark");
    expect(html.dataset.theme).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("still applies a choice when storage is blocked", () => {
    blockStorage();
    setTheme("dark");
    expect(html.dataset.theme).toBe("dark");
  });

  it("follows the system only while no choice is stored", () => {
    const unsubscribe = subscribeTheme(() => {});
    setSystemDark(true);
    expect(html.dataset.theme).toBe("dark");

    setTheme("light");
    setSystemDark(true);
    expect(html.dataset.theme).toBe("light");
    unsubscribe();
  });

  it("cross-fades with View Transitions, unless motion is reduced", () => {
    const startViewTransition = vi.fn((update: () => void) => update());
    Object.defineProperty(document, "startViewTransition", {
      value: startViewTransition,
      configurable: true,
    });

    setTheme("dark");
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(html.dataset.theme).toBe("dark");

    media.reducedMotion = true;
    setTheme("light");
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(html.dataset.theme).toBe("light");
  });
});

describe("ThemeToggle", () => {
  it("reflects and toggles the theme", () => {
    html.dataset.theme = "light";
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark theme" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    act(() => fireEvent.click(toggle));
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(html.dataset.theme).toBe("dark");
    expect(readStoredTheme()).toBe("dark");

    act(() => fireEvent.click(toggle));
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
