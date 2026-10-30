import { useEffect, useId, useRef, useState } from "react";

import { ACCENTS, type Accent, setAccent } from "~/lib/accent";
import { cx } from "~/lib/cx";
import { useAccent } from "~/lib/useAccent";

import { site } from "../../../content/site";

const copy = site.accents;

// The floating accent palette (T-047, D-038), fixed to the left edge and
// vertically centred on every page. From tablet width up it is a rail of six
// swatches; on phones a tab showing the current accent opens the rail. The
// swatches are native radio buttons in a labelled radio group, so arrow keys
// move between colors and screen readers announce each one; a status message
// confirms the choice. page-container keeps its content clear of it
// (--space-rail). Like the other preferences, it is disabled until
// hydration, when the current accent is known.
export function AccentPalette() {
  const accent = useAccent();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const groupId = useId();

  // While the phone rail is open, Escape closes it and returns focus to the
  // tab; a pointer press or focus moving outside the palette closes it.
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const close = () => setOpen(false);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    }
    // Only focus moving to another element closes it: a press on a swatch
    // first blurs the tab with no new target, and must not hide the swatch
    // before its click lands. Presses outside are handled below.
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget;
      if (next instanceof Node && !root?.contains(next)) close();
    }
    function onPointerDown(event: PointerEvent) {
      if (!root?.contains(event.target as Node)) close();
    }
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function choose(next: Accent) {
    setAccent(next);
    setAnnouncement(`${copy.names[next]} ${copy.on}`);
  }

  return (
    <div
      ref={rootRef}
      className="fixed top-1/2 left-0 z-40 flex -translate-y-1/2 items-center gap-2 md:left-2"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={groupId}
        aria-label={
          accent ? `${copy.label}: ${copy.names[accent]}` : copy.label
        }
        title={copy.label}
        disabled={accent === null}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 w-6 items-center justify-center rounded-r-md bg-accent text-accent-fg disabled:cursor-default md:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cx(
            "size-4 transition-transform duration-(--duration-fast) ease-standard",
            open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <div
        id={groupId}
        role="radiogroup"
        aria-label={copy.label}
        className={cx(
          "flex-col gap-1.5 rounded-full border border-line bg-surface-raised p-1 md:flex",
          open ? "flex" : "hidden",
        )}
      >
        {ACCENTS.map((option) => (
          <label
            key={option}
            data-accent={option}
            title={copy.names[option]}
            className="accent-swatch relative flex size-6 cursor-pointer items-center justify-center rounded-full has-disabled:cursor-default has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name="accent"
              value={option}
              checked={accent === option}
              disabled={accent === null}
              onChange={() => choose(option)}
              className="peer sr-only"
            />
            <span className="sr-only">{copy.names[option]}</span>
            {/* The check marks the choice without relying on color. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="hidden size-3.5 peer-checked:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </label>
        ))}
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
