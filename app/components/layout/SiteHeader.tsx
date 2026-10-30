import { Link, NavLink } from "react-router";

import { contact } from "../../../content/contact";
import { site } from "../../../content/site";
import { CommandMenu } from "./CommandMenu";
import { CvLink } from "./CvLink";
import { ThemeToggle } from "./ThemeToggle";
import { useHeaderOffset } from "./useHeaderOffset";

// The floating header (T-048, D-042): a rounded bar on the raised surface,
// inset from the edges with a gap above it, that stays in view while the page
// scrolls (sticky, so it keeps its place in the flow and nothing shifts). The
// header box itself is transparent and lets pointer events through, so only
// the bar catches them. useHeaderOffset publishes the bar's height, which
// scroll-padding-top uses to keep anchor and focus targets below it.
export function SiteHeader() {
  const barRef = useHeaderOffset();
  return (
    <header className="site-header">
      <div className="page-container">
        <div
          ref={barRef}
          className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-xl border border-line bg-surface-raised px-4 py-3 shadow-raised sm:px-5"
        >
          <Link to="/" className="rounded-sm leading-tight">
            <span className="block font-display text-lg font-semibold">
              {site.name}
            </span>
            <span className="block font-mono text-xs text-fg-muted">
              {site.role}
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <nav aria-label={site.navigationLabel}>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6">
                {site.navigation.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      className="rounded-sm py-1 text-sm font-medium text-fg-muted transition-colors duration-(--duration-fast) ease-standard hover:text-fg aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Visible text is the short label; the accessible name contains
                it (WCAG 2.5.3) and says what the link does. It opens the CV
                preview (T-056). */}
              <CvLink
                aria-label={`${contact.cv.previewLabel} (${contact.cv.format})`}
                variant="secondary"
                size="sm"
              >
                {contact.cv.shortLabel}
              </CvLink>
              <CommandMenu />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
