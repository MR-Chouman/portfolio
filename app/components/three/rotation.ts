// Rotation of a case study's 3D object (T-034, D-032), kept free of Three.js
// so it is unit-tested and shipped in the small route chunk. Angles are in
// radians: yaw turns around the vertical axis, pitch tilts towards the viewer.

export interface Rotation {
  yaw: number;
  pitch: number;
}

const DEG = Math.PI / 180;

// A three-quarter view from slightly above.
export const INITIAL_ROTATION: Rotation = { yaw: 330 * DEG, pitch: 20 * DEG };
export const MAX_PITCH = 35 * DEG;
// One arrow key press.
export const KEY_STEP = 15 * DEG;
// Idle spin speed, and how long it waits after the visitor's last input.
export const IDLE_SPEED = 10 * DEG;
export const IDLE_DELAY_MS = 3000;
// Radians per CSS pixel dragged.
export const DRAG_SPEED = 0.01;

const TURN = 2 * Math.PI;

function clampPitch(pitch: number): number {
  return Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch));
}

// Keeps yaw in [0, 2π) so long spins never lose precision.
function wrapYaw(yaw: number): number {
  return ((yaw % TURN) + TURN) % TURN;
}

export function rotate(
  rotation: Rotation,
  deltaYaw: number,
  deltaPitch: number,
): Rotation {
  return {
    yaw: wrapYaw(rotation.yaw + deltaYaw),
    pitch: clampPitch(rotation.pitch + deltaPitch),
  };
}

export function drag(rotation: Rotation, dx: number, dy: number): Rotation {
  return rotate(rotation, dx * DRAG_SPEED, dy * DRAG_SPEED);
}

// The rotation after a key press, or null when the key does not rotate (so
// the caller leaves the event alone, e.g. Tab).
export function keyRotation(rotation: Rotation, key: string): Rotation | null {
  switch (key) {
    case "ArrowLeft":
      return rotate(rotation, -KEY_STEP, 0);
    case "ArrowRight":
      return rotate(rotation, KEY_STEP, 0);
    case "ArrowUp":
      return rotate(rotation, 0, -KEY_STEP);
    case "ArrowDown":
      return rotate(rotation, 0, KEY_STEP);
    case "Home":
      return INITIAL_ROTATION;
    default:
      return null;
  }
}

// The idle spin over `elapsedMs`: none under reduced motion or until
// IDLE_DELAY_MS after the last input (`sinceInputMs`).
export function idle(
  rotation: Rotation,
  elapsedMs: number,
  sinceInputMs: number,
  reducedMotion: boolean,
): Rotation {
  if (reducedMotion || sinceInputMs < IDLE_DELAY_MS) return rotation;
  return rotate(rotation, (IDLE_SPEED * elapsedMs) / 1000, 0);
}
