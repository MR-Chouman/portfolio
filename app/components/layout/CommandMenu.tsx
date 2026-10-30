import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { site } from "../../../content/site";

const copy = site.commandPalette;

// The palette and cmdk load only when the visitor first asks for them
// (T-043), so they never weigh on the initial JavaScript.
const loadPalette = () => import("./CommandPalette");
const CommandPalette = lazy(loadPalette);

// Ctrl+K, or Cmd+K on Apple keyboards. Shift and Alt variants are left to
// the browser and assistive technology.
export function isPaletteShortcut(event: KeyboardEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === "k"
  );
}

const noop = () => () => {};

// The header button and the global shortcut for the command palette. Like
// the other header controls, the button is disabled until hydration.
export function CommandMenu() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  // Stays true after the first open, so the loaded palette is reused.
  const [requested, setRequested] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
    setAnnouncement("");
    setRequested(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPaletteShortcut(event)) return;
      event.preventDefault();
      if (open) setOpen(false);
      else show();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, show]);

  // Called once the dialog has closed (Escape, a command, the shortcut or a
  // click outside), when the page outside it can take focus again.
  const closed = useCallback(() => {
    setOpen(false);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) target.focus();
  }, []);

  const preload = () => void loadPalette();

  return (
    <>
      <button
        type="button"
        aria-label={copy.open}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        title={`${copy.open} (Ctrl+K)`}
        disabled={!hydrated}
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        className="inline-flex size-9 items-center justify-center rounded-md border border-line text-fg-muted transition-colors duration-(--duration-fast) ease-standard hover:border-fg-muted hover:text-fg disabled:cursor-default"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="m7.5 9.5 3 2.5-3 2.5M12.5 15h4" />
        </svg>
      </button>
      {requested && (
        <Suspense fallback={null}>
          <CommandPalette
            open={open}
            onClosed={closed}
            onAnnounce={setAnnouncement}
          />
        </Suspense>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
