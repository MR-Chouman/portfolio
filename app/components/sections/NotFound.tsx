import { Link } from "~/components/ui";

import { notFound } from "../../../content/not-found";

// The 404 page body (T-025). Rendered by the catch-all route, which is
// prerendered to 404.html, and by the root error boundary for 404 responses
// (for example an unknown case study slug), so both show the same markup.
export function NotFound() {
  return (
    <div className="page-container pt-section">
      <header className="max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {notFound.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{notFound.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{notFound.body}</p>
      </header>
      <ul className="mt-8 flex flex-wrap gap-6">
        {notFound.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Title, description and noindex for the 404 page. No canonical URL or Open
// Graph tags: the page is served at whatever unknown URL was requested.
export function notFoundMeta() {
  return [
    { title: notFound.meta.title },
    { name: "description", content: notFound.meta.description },
    { name: "robots", content: "noindex" },
  ];
}
