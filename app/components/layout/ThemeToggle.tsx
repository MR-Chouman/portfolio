import { setTheme } from "~/lib/theme";
import { useTheme } from "~/lib/useTheme";

import { site } from "../../../content/site";

// A toggle button: pressed means dark. The icon follows `data-theme` through
// CSS, so it is right from the first paint, before hydration.
export function ThemeToggle() {
  const theme = useTheme();
  return (
    <button
      type="button"
      aria-pressed={theme === null ? undefined : theme === "dark"}
      aria-label={site.themeToggle}
      title={site.themeToggle}
      disabled={theme === null}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center rounded-md border border-line text-fg-muted transition-colors duration-(--duration-fast) ease-standard hover:border-fg-muted hover:text-fg disabled:cursor-default"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-[18px] in-data-[theme=dark]:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="hidden size-[18px] in-data-[theme=dark]:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
