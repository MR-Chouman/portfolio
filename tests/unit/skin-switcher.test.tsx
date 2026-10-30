import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SkinSwitcher } from "~/components/layout/SkinSwitcher";
import {
  FONT_TIMEOUT_MS,
  loadSkinFonts,
  nextSkin,
  SKIN_FONTS,
  SKIN_PRELOADS,
  SKIN_TRANSITION_ATTRIBUTE,
  skinScript,
  SKINS,
  switchSkin,
} from "~/lib/skin";

import { site } from "../../content/site";

// The skin switcher (T-042): font loading, the circular reveal and the
// header control.

const html = document.documentElement;
const media = { reducedMotion: false };

function stubFonts(load: (font: string) => Promise<unknown>) {
  const fonts = { load: vi.fn(load) };
  Object.defineProperty(document, "fonts", {
    value: fonts,
    configurable: true,
  });
  return fonts;
}

type FakeTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  finish: () => void;
};

// Runs the update callback at once, like a browser after its snapshot, and
// lets the test decide when the transition finishes.
function stubViewTransitions() {
  const transitions: FakeTransition[] = [];
  const start = vi.fn((update: () => void) => {
    update();
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const transition = { ready: Promise.resolve(), finished, finish };
    transitions.push(transition);
    return transition;
  });
  Object.defineProperty(document, "startViewTransition", {
    value: start,
    configurable: true,
  });
  return { start, transitions };
}

beforeEach(() => {
  media.reducedMotion = false;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduced-motion") && media.reducedMotion,
    media: query,
  }));
  localStorage.clear();
  html.dataset.skin = "editorial";
  html.removeAttribute(SKIN_TRANSITION_ATTRIBUTE);
  html.style.removeProperty("--duration-slow");
  html.animate = vi.fn() as unknown as typeof html.animate;
  window.history.replaceState(null, "", "/");
  document.head
    .querySelectorAll('link[rel="preload"]')
    .forEach((link) => link.remove());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "startViewTransition");
  Reflect.deleteProperty(document, "fonts");
  Reflect.deleteProperty(html, "animate");
});

describe("font preloads in the pre-paint script", () => {
  function preloads() {
    return [...document.head.querySelectorAll('link[rel="preload"]')].map(
      (link) => ({
        href: link.getAttribute("href"),
        as: link.getAttribute("as"),
        crossOrigin: link.getAttribute("crossorigin"),
      }),
    );
  }

  it("preloads Fraunces for the editorial skin only", () => {
    expect(SKIN_PRELOADS.editorial).toHaveLength(1);
    expect(SKIN_PRELOADS.editorial[0]).toMatch(/fraunces.*\.woff2/);
    expect(SKIN_PRELOADS.systems).toEqual([]);

    new Function(skinScript)();
    expect(preloads()).toEqual([
      {
        href: SKIN_PRELOADS.editorial[0],
        as: "font",
        crossOrigin: "anonymous",
      },
    ]);
  });

  it("adds no preload for the systems skin", () => {
    window.history.replaceState(null, "", "/?skin=systems");
    new Function(skinScript)();
    expect(preloads()).toEqual([]);
  });
});

describe("skin helpers for the switcher", () => {
  it("cycles through every skin", () => {
    expect(nextSkin("editorial")).toBe("systems");
    expect(nextSkin("systems")).toBe("editorial");
    for (const skin of SKINS)
      expect(SKIN_FONTS[skin].length).toBeGreaterThan(0);
  });

  it("loads every font of the target skin", async () => {
    const fonts = stubFonts(() => Promise.resolve([]));
    await loadSkinFonts("editorial");
    expect(fonts.load.mock.calls.map(([font]) => font)).toEqual(
      SKIN_FONTS.editorial,
    );
  });

  it("goes ahead after a timeout or a failed load", async () => {
    vi.useFakeTimers();
    stubFonts(() => new Promise(() => {}));
    const slow = loadSkinFonts("systems");
    await vi.advanceTimersByTimeAsync(FONT_TIMEOUT_MS);
    await expect(slow).resolves.toBeUndefined();

    stubFonts(() => Promise.reject(new Error("network")));
    await expect(loadSkinFonts("systems")).resolves.toBeUndefined();
  });

  it("does nothing without the Font Loading API", async () => {
    await expect(loadSkinFonts("systems")).resolves.toBeUndefined();
  });
});

describe("switchSkin", () => {
  it("applies the skin only after its fonts are loaded", async () => {
    let release = () => {};
    stubFonts(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const done = switchSkin("systems");
    await Promise.resolve();
    expect(html.dataset.skin).toBe("editorial");
    release();
    await done;
    expect(html.dataset.skin).toBe("systems");
    expect(localStorage.getItem("skin")).toBe("systems");
  });

  it("reveals the new skin with a circle from the origin", async () => {
    const { start, transitions } = stubViewTransitions();
    html.style.setProperty("--duration-slow", "400ms");
    const done = switchSkin("systems", { x: 100, y: 20 });
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    expect(html.hasAttribute(SKIN_TRANSITION_ATTRIBUTE)).toBe(true);
    expect(html.dataset.skin).toBe("systems");

    await vi.waitFor(() => expect(html.animate).toHaveBeenCalledTimes(1));
    const [keyframes, options] = vi.mocked(html.animate).mock.calls[0] ?? [];
    const { clipPath } = keyframes as { clipPath: string[] };
    expect(clipPath[0]).toBe("circle(0px at 100px 20px)");
    const radius = Math.hypot(window.innerWidth - 100, window.innerHeight - 20);
    expect(clipPath[1]).toBe(`circle(${radius}px at 100px 20px)`);
    expect(options).toMatchObject({
      duration: 400,
      pseudoElement: "::view-transition-new(root)",
    });

    transitions[0]?.finish();
    await done;
    expect(html.hasAttribute(SKIN_TRANSITION_ATTRIBUTE)).toBe(false);
  });

  it("switches instantly when the visitor prefers reduced motion", async () => {
    const { start } = stubViewTransitions();
    media.reducedMotion = true;
    await switchSkin("systems");
    expect(start).not.toHaveBeenCalled();
    expect(html.animate).not.toHaveBeenCalled();
    expect(html.dataset.skin).toBe("systems");
  });

  it("switches instantly without View Transitions", async () => {
    await switchSkin("systems");
    expect(html.dataset.skin).toBe("systems");
    expect(html.hasAttribute(SKIN_TRANSITION_ATTRIBUTE)).toBe(false);
  });

  it("applies only the latest of overlapping switches", async () => {
    const releases: (() => void)[] = [];
    stubFonts(
      () =>
        new Promise<void>((resolve) => {
          releases.push(resolve);
        }),
    );
    const first = switchSkin("systems");
    const second = switchSkin("editorial");
    releases.forEach((release) => release());
    await Promise.all([first, second]);
    expect(html.dataset.skin).toBe("editorial");
    expect(localStorage.getItem("skin")).toBe("editorial");
  });
});

describe("SkinSwitcher", () => {
  const copy = site.skinSwitcher;

  it("names every skin", () => {
    expect(Object.keys(copy.names).sort()).toEqual([...SKINS].sort());
  });

  it("describes the current design and announces a switch", async () => {
    render(<SkinSwitcher />);
    const button = screen.getByRole("button", { name: copy.label });
    expect(button).toBeEnabled();
    expect(button).toHaveAccessibleDescription("Current design: Editorial");
    expect(screen.getByRole("status")).toHaveTextContent("");

    await act(async () => {
      fireEvent.click(button);
    });
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Systems design on"),
    );
    expect(html.dataset.skin).toBe("systems");
    expect(button).toHaveAccessibleDescription("Current design: Systems");

    await act(async () => {
      fireEvent.click(button);
    });
    await vi.waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Editorial design on",
      ),
    );
    expect(html.dataset.skin).toBe("editorial");
  });
});
