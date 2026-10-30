import { describe, expect, it } from "vitest";

import { contrast, parseOklch } from "./helpers/contrast";

describe("contrast helper", () => {
  it("reads the lightness as a number or as a percentage", () => {
    expect(parseOklch("oklch(95% .004 250)")).toEqual(
      parseOklch("oklch(0.95 0.004 250)"),
    );
  });

  it("gives 21:1 for black on white and 1:1 for a color on itself", () => {
    expect(contrast("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 1);
    expect(contrast("oklch(50% 0.1 30)", "oklch(0.5 0.1 30)")).toBe(1);
  });

  it("rejects colors that are not oklch()", () => {
    expect(() => parseOklch("#fff")).toThrow(/Not an oklch/);
  });
});
