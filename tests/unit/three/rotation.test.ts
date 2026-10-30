import { describe, expect, it } from "vitest";

import {
  drag,
  idle,
  IDLE_DELAY_MS,
  IDLE_SPEED,
  INITIAL_ROTATION,
  KEY_STEP,
  keyRotation,
  MAX_PITCH,
  rotate,
} from "~/components/three/rotation";

const start = { yaw: 1, pitch: 0 };

describe("3D object rotation (T-034)", () => {
  it("turns with the arrow keys and ignores other keys", () => {
    expect(keyRotation(start, "ArrowRight")?.yaw).toBeCloseTo(1 + KEY_STEP);
    expect(keyRotation(start, "ArrowLeft")?.yaw).toBeCloseTo(1 - KEY_STEP);
    expect(keyRotation(start, "ArrowDown")?.pitch).toBeCloseTo(KEY_STEP);
    expect(keyRotation(start, "ArrowUp")?.pitch).toBeCloseTo(-KEY_STEP);
    expect(keyRotation(start, "Tab")).toBeNull();
    expect(keyRotation(start, "Enter")).toBeNull();
  });

  it("goes back to the starting view with Home", () => {
    const home = keyRotation(start, "Home");
    expect(home?.pitch).toBe(INITIAL_ROTATION.pitch);
    expect(Math.cos(home?.yaw ?? 0)).toBeCloseTo(
      Math.cos(INITIAL_ROTATION.yaw),
    );
  });

  it("turns all the way round but clamps the tilt", () => {
    let rotation = start;
    for (let step = 0; step < 24; step++)
      rotation = rotate(rotation, KEY_STEP, 0);
    expect(rotation.yaw).toBeCloseTo(1);
    expect(rotation.yaw).toBeGreaterThanOrEqual(0);
    expect(rotation.yaw).toBeLessThan(2 * Math.PI);
    expect(rotate(start, 0, 10).pitch).toBe(MAX_PITCH);
    expect(rotate(start, 0, -10).pitch).toBe(-MAX_PITCH);
  });

  it("follows a drag: sideways turns, up and down tilts", () => {
    const moved = drag(start, 50, -20);
    expect(moved.yaw).toBeGreaterThan(start.yaw);
    expect(moved.pitch).toBeLessThan(start.pitch);
  });

  it("spins slowly when left alone", () => {
    const spun = idle(start, 1000, IDLE_DELAY_MS, false);
    expect(spun.yaw).toBeCloseTo(1 + IDLE_SPEED);
  });

  it("does not spin right after an input or under reduced motion", () => {
    expect(idle(start, 1000, IDLE_DELAY_MS - 1, false)).toBe(start);
    expect(idle(start, 1000, Number.POSITIVE_INFINITY, true)).toBe(start);
  });
});
