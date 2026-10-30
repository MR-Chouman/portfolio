import { useEffect, useId, useRef, useState } from "react";

import type { ProjectObjectKind } from "../../../content/schema";
import { observeTokens, readColors } from "./colors";
import {
  drag,
  idle,
  INITIAL_ROTATION,
  keyRotation,
  type Rotation,
} from "./rotation";
import type { MountedScene } from "./scene";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEG = 180 / Math.PI;

export interface ProjectObjectProps {
  kind: ProjectObjectKind;
  // Accessible name of the model.
  label: string;
  hint: string;
  fallback: string;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// The rotatable 3D object of a case study (T-034, D-032). The box reserves
// its size in the prerendered HTML (no layout shift). Once it scrolls into
// view after hydration, the Three.js scene is imported as its own chunk, so
// other pages never load it. The visitor drags it or turns it with the arrow
// keys (Home resets); it spins slowly when left alone, except under reduced
// motion. Without WebGL the caption says so instead of giving the hint.
export function ProjectObject({
  kind,
  label,
  hint,
  fallback,
}: ProjectObjectProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<Rotation>(INITIAL_ROTATION);
  const lastInputRef = useRef(Number.NEGATIVE_INFINITY);
  const dirtyRef = useRef(true);
  const [failed, setFailed] = useState(false);
  const captionId = useId();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const motion = window.matchMedia(REDUCED_MOTION_QUERY);
    let scene: MountedScene | undefined;
    let disposed = false;
    let visible = false;
    let frame = 0;
    let previous = 0;
    let stopTokens = () => {};

    const tick = (now: number) => {
      frame = 0;
      if (!scene || !visible || document.hidden) return;
      const elapsed = previous ? now - previous : 0;
      previous = now;
      const next = idle(
        rotationRef.current,
        elapsed,
        now - lastInputRef.current,
        motion.matches,
      );
      if (next !== rotationRef.current) {
        rotationRef.current = next;
        dirtyRef.current = true;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        scene.setRotation(rotationRef.current);
        scene.render();
        box.dataset.yaw = String(Math.round(rotationRef.current.yaw * DEG));
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame && scene && visible && !document.hidden) {
        previous = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    const mount = () => {
      if (!supportsWebGL()) {
        setFailed(true);
        return;
      }
      import("./scene")
        .then(({ mountScene }) => {
          if (disposed) return;
          scene = mountScene(box, kind, readColors(box));
          stopTokens = observeTokens(() => {
            scene?.setColors(readColors(box));
            dirtyRef.current = true;
          });
          box.dataset.ready = "true";
          start();
        })
        .catch(() => {
          if (!disposed) setFailed(true);
        });
    };

    const onVisible = (isVisible: boolean) => {
      visible = isVisible;
      if (visible && !scene && !box.dataset.loading) {
        box.dataset.loading = "true";
        mount();
      }
      start();
    };
    // Without IntersectionObserver the object loads at once and always draws.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver(([entry]) =>
            onVisible(entry?.isIntersecting ?? false),
          );
    if (observer) observer.observe(box);
    else onVisible(true);

    // An input moves the model now and holds the idle spin back.
    const input = (next: Rotation) => {
      rotationRef.current = next;
      lastInputRef.current = performance.now();
      dirtyRef.current = true;
      start();
    };
    let pointer: { id: number; x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      box.setPointerCapture(event.pointerId);
      lastInputRef.current = performance.now();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      input(
        drag(
          rotationRef.current,
          event.clientX - pointer.x,
          event.clientY - pointer.y,
        ),
      );
      pointer = { ...pointer, x: event.clientX, y: event.clientY };
    };
    const onPointerUp = () => {
      pointer = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const next = keyRotation(rotationRef.current, event.key);
      if (!next) return;
      event.preventDefault();
      input(next);
    };
    const onVisibility = () => start();

    box.addEventListener("pointerdown", onPointerDown);
    box.addEventListener("pointermove", onPointerMove);
    box.addEventListener("pointerup", onPointerUp);
    box.addEventListener("pointercancel", onPointerUp);
    box.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      observer?.disconnect();
      stopTokens();
      cancelAnimationFrame(frame);
      box.removeEventListener("pointerdown", onPointerDown);
      box.removeEventListener("pointermove", onPointerMove);
      box.removeEventListener("pointerup", onPointerUp);
      box.removeEventListener("pointercancel", onPointerUp);
      box.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      scene?.dispose();
      delete box.dataset.loading;
      delete box.dataset.ready;
    };
  }, [kind]);

  return (
    <figure className="project-object">
      <div
        ref={boxRef}
        role="img"
        aria-label={label}
        aria-describedby={captionId}
        tabIndex={failed ? undefined : 0}
        className="project-object-stage aspect-4/3 w-full rounded-xl border border-line bg-surface-raised"
      />
      <figcaption id={captionId} className="mt-3 text-sm text-fg-muted">
        {failed ? fallback : hint}
      </figcaption>
    </figure>
  );
}
