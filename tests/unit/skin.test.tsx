import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentSkin,
  DEFAULT_SKIN,
  isSkin,
  prePaintScript,
  readSkinParam,
  readStoredSkin,
  resolveSkin,
  setSkin,
  SKIN_STORAGE_KEY,
  skinScript,
  subscribeSkin,
} from "~/lib/skin";
import { useSkin } from "~/lib/useSkin";

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete html.dataset.skin;
  delete html.dataset.theme;
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function runSkinScript(search = "") {
  window.history.replaceState(null, "", `/${search}`);
  new Function(skinScript)();
  return html.dataset.skin;
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
  it("defaults to the editorial skin", () => {
    expect(DEFAULT_SKIN).toBe("editorial");
    expect(runSkinScript()).toBe("editorial");
  });

  it("uses the stored choice", () => {
    localStorage.setItem(SKIN_STORAGE_KEY, "systems");
    expect(runSkinScript()).toBe("systems");
  });

  it("ignores an unknown stored value", () => {
    localStorage.setItem(SKIN_STORAGE_KEY, "brutalist");
    expect(runSkinScript()).toBe("editorial");
  });

  it("lets a valid parameter win and stores it", () => {
    localStorage.setItem(SKIN_STORAGE_KEY, "editorial");
    expect(runSkinScript("?skin=systems")).toBe("systems");
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBe("systems");
    // The next page, without the parameter, keeps the skin.
    expect(runSkinScript()).toBe("systems");
  });

  it("ignores an unknown parameter and keeps the stored choice", () => {
    localStorage.setItem(SKIN_STORAGE_KEY, "systems");
    expect(runSkinScript("?skin=brutalist")).toBe("systems");
    expect(runSkinScript("?skin=")).toBe("systems");
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBe("systems");
  });

  it("reads the parameter among others", () => {
    expect(runSkinScript("?utm_source=cv&skin=systems")).toBe("systems");
  });

  it("survives blocked storage", () => {
    blockStorage();
    expect(runSkinScript()).toBe("editorial");
    expect(runSkinScript("?skin=systems")).toBe("systems");
  });

  it("runs with the theme script in one inline script", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("dark"),
      media: query,
    }));
    window.history.replaceState(null, "", "/?skin=systems");
    new Function(prePaintScript)();
    expect(html.dataset.theme).toBe("dark");
    expect(html.dataset.skin).toBe("systems");
  });
});

describe("skin helpers", () => {
  it("recognizes only the shipped skins", () => {
    expect(isSkin("editorial")).toBe(true);
    expect(isSkin("systems")).toBe(true);
    expect(isSkin("Systems")).toBe(false);
    expect(isSkin(null)).toBe(false);
  });

  it("reads the parameter from a query string", () => {
    expect(readSkinParam("?skin=systems")).toBe("systems");
    expect(readSkinParam("skin=editorial&x=1")).toBe("editorial");
    expect(readSkinParam("?skin=nope")).toBeNull();
    expect(readSkinParam("")).toBeNull();
  });

  it("resolves in the same order as the pre-paint script", () => {
    expect(resolveSkin("")).toBe("editorial");
    localStorage.setItem(SKIN_STORAGE_KEY, "systems");
    expect(resolveSkin("")).toBe("systems");
    expect(resolveSkin("?skin=editorial")).toBe("editorial");
    expect(resolveSkin("?skin=nope")).toBe("systems");
  });

  it("reads nothing when storage is blocked", () => {
    blockStorage();
    expect(readStoredSkin()).toBeNull();
    expect(resolveSkin("")).toBe("editorial");
  });

  it("reads the current skin from <html>, with the default as fallback", () => {
    expect(currentSkin()).toBe("editorial");
    html.dataset.skin = "systems";
    expect(currentSkin()).toBe("systems");
    html.dataset.skin = "unknown";
    expect(currentSkin()).toBe("editorial");
  });
});

describe("skin store", () => {
  it("applies, stores and announces a choice", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSkin(listener);
    setSkin("systems");
    expect(html.dataset.skin).toBe("systems");
    expect(readStoredSkin()).toBe("systems");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSkin("editorial");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("still applies a choice when storage is blocked", () => {
    blockStorage();
    setSkin("systems");
    expect(html.dataset.skin).toBe("systems");
  });

  it("useSkin follows the skin on <html>", () => {
    html.dataset.skin = "editorial";
    const { result } = renderHook(() => useSkin());
    expect(result.current).toBe("editorial");
    act(() => setSkin("systems"));
    expect(result.current).toBe("systems");
  });
});
