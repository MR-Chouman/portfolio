import { Link, NavLink } from "react-router";

import { site } from "../../../content/site";

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
        <nav aria-label={site.navigationLabel}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
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
      </div>
    </header>
  );
}
