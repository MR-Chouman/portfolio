import { Link, NavLink } from "react-router";

import { ButtonLink } from "~/components/ui";

import { contact } from "../../../content/contact";
import { site } from "../../../content/site";
import { CommandMenu } from "./CommandMenu";
import { SkinSwitcher } from "./SkinSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="page-container flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5">
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
            {/* Visible text is the short label; the accessible name starts
                with it (WCAG 2.5.3) and says what the link does. */}
            <ButtonLink
              href={contact.cv.href}
              download={contact.cv.fileName}
              type="application/pdf"
              aria-label={`${contact.cv.label} (${contact.cv.format})`}
              variant="secondary"
              size="sm"
            >
              {contact.cv.shortLabel}
            </ButtonLink>
            <CommandMenu />
            <SkinSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
