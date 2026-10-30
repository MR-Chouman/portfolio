import type { MetaDescriptor } from "react-router";

import { site } from "../../content/site";

// Canonical production origin (D-018, D-029).
export const SITE_ORIGIN = "https://mr-chouman-portfolio.pages.dev";

// The URL a page is served at. Every page is prerendered to
// `<path>/index.html`, and Cloudflare Pages redirects `/about` to `/about/`
// (308), so canonical, Open Graph and sitemap URLs end with a slash (T-060,
// D-050, F-017). Query strings and fragments are dropped.
export function canonicalUrl(path: string): string {
  const url = new URL(path, SITE_ORIGIN);
  const pathname = url.pathname.endsWith("/")
    ? url.pathname
    : `${url.pathname}/`;
  return new URL(pathname, SITE_ORIGIN).href;
}

interface PageMeta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  // Open Graph object type: case studies are articles, other pages websites.
  type?: "website" | "article";
}

export function pageMeta({
  title,
  description,
  path,
  noindex = false,
  type = "website",
}: PageMeta): MetaDescriptor[] {
  const url = canonicalUrl(path);
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: site.name },
    { property: "og:locale", content: "en_US" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    // T-061 adds per-page images and moves this to summary_large_image.
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
  ];
}
