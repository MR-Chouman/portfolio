import type { MetaDescriptor } from "react-router";

import { site } from "../../content/site";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  ogImagePath,
} from "./og-image";

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

// The image link previews show (T-061, D-051): a site path to a generated
// card and its alt text.
export interface PageImage {
  path: string;
  alt: string;
}

export const SITE_IMAGE: PageImage = {
  path: ogImagePath(),
  alt: site.openGraph.site.alt,
};

interface PageMeta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  // Open Graph object type: case studies are articles, other pages websites.
  type?: "website" | "article";
  // Defaults to the site card.
  image?: PageImage;
}

export function pageMeta({
  title,
  description,
  path,
  noindex = false,
  type = "website",
  image = SITE_IMAGE,
}: PageMeta): MetaDescriptor[] {
  const url = canonicalUrl(path);
  // Scrapers need an absolute URL; the file is served as is, not as a page.
  const imageUrl = new URL(image.path, SITE_ORIGIN).href;
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
    { property: "og:image", content: imageUrl },
    { property: "og:image:type", content: OG_IMAGE_TYPE },
    { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
    { property: "og:image:alt", content: image.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: image.alt },
    ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
  ];
}
