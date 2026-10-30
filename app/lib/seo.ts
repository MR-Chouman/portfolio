import type { MetaDescriptor } from "react-router";

// Canonical production origin (D-018).
export const SITE_ORIGIN = "https://portfolio-4q6.pages.dev";

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
  const url = new URL(path, SITE_ORIGIN).href;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
  ];
}
