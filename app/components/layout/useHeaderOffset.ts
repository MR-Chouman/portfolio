import { useEffect, useRef } from "react";

// Publishes the floating header bar's height as --header-height on <html>
// (T-048), and keeps it current when the bar wraps or the text is zoomed.
// base.css turns it into scroll-padding-top, so the browser scrolls anchor
// targets and newly focused elements clear of the bar. Before hydration a
// fallback in base.css applies; writing the property never moves layout.
export function useHeaderOffset() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty(
        "--header-height",
        `${bar.getBoundingClientRect().height}px`,
      );
    update();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(bar);
    return () => {
      observer?.disconnect();
      root.style.removeProperty("--header-height");
    };
  }, []);

  return ref;
}
