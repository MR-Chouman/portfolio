import { describe, expect, it, vi } from "vitest";

import { observeTokens, toRgb } from "~/components/three/colors";

// A 2D context stub that "paints" the last fillStyle as the pixel read back.
function context(pixels: Record<string, number[]>) {
  let fill = "";
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    set fillStyle(value: string) {
      fill = value;
    },
    get fillStyle() {
      return fill;
    },
    getImageData: () => ({ data: pixels[fill] ?? [0, 0, 0, 0] }),
  } as unknown as CanvasRenderingContext2D;
}

describe("3D object colors (T-034)", () => {
  it("reads a token color back from the canvas as 0xrrggbb", () => {
    const ctx = context({ "oklch(0.53 0.19 32)": [200, 60, 30, 255] });
    expect(toRgb("oklch(0.53 0.19 32)", ctx)).toBe(0xc83c1e);
  });

  it("falls back to grey without a canvas or for an unreadable color", () => {
    expect(toRgb("oklch(0.5 0.1 30)", null)).toBe(0x808080);
    expect(toRgb("", context({}))).toBe(0x808080);
    expect(toRgb("not-a-color", context({}))).toBe(0x808080);
  });

  it("calls back when the theme on <html> changes, until stopped", async () => {
    const listener = vi.fn();
    const stop = observeTokens(listener);
    document.documentElement.dataset.theme = "dark";
    await Promise.resolve();
    expect(listener).toHaveBeenCalled();
    stop();
    listener.mockClear();
    document.documentElement.dataset.theme = "light";
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
    delete document.documentElement.dataset.theme;
  });
});
