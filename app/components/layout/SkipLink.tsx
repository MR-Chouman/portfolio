import { site } from "../../../content/site";

// First focusable element on every page; visible only when focused.
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-surface-raised px-4 py-2 font-medium text-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      {site.skipLink}
    </a>
  );
}
