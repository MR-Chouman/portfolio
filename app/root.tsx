import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SkipLink } from "./components/layout/SkipLink";
import { NotFound, notFoundMeta } from "./components/sections/NotFound";
import { Link } from "./components/ui";
import { themeScript } from "./lib/theme";
import "./styles/base.css";
import { notFound } from "../content/not-found";
import { site } from "../content/site";
import frauncesLatin from "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";

// Preload the default skin's latin fonts used above the fold (T-011).
export const links: Route.LinksFunction = () =>
  [geistLatin, frauncesLatin].map((href) => ({
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  }));

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // The pre-paint script sets data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Before the stylesheets, so the first paint uses the right theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <SkipLink />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

function isNotFound(error: unknown): boolean {
  return isRouteErrorResponse(error) && error.status === 404;
}

// Only used when a route throws: the 404 page's tags for a 404 response
// (an unknown case study slug), otherwise the error page's title.
export const meta: Route.MetaFunction = ({ error }) => {
  if (!error) return [];
  if (isNotFound(error)) return notFoundMeta();
  return [
    { title: `${notFound.error.title} · ${site.name}` },
    { name: "robots", content: "noindex" },
  ];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isNotFound(error)) return <NotFound />;

  const { title, body, link } = notFound.error;
  const stack =
    import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <div className="page-container pt-section">
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-reading text-lg text-fg-muted">{body}</p>
      <p className="mt-8">
        <Link href={link.href}>{link.label}</Link>
      </p>
      {stack && (
        <pre className="mt-6 w-full overflow-x-auto rounded-lg bg-surface-raised p-4 text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}
