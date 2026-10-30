import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom has no matchMedia. Default: no media query matches (light theme, motion
// allowed). Tests that need other preferences stub their own.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) satisfies MediaQueryList;
}

// jsdom has no IntersectionObserver. Default: nothing ever scrolls into view,
// so the 3D objects (T-034) stay unloaded. Tests that need it stub their own.
if (typeof window.IntersectionObserver !== "function") {
  window.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    readonly scrollMargin = "0px";
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

afterEach(() => {
  cleanup();
});
