import { describe, expect, it } from "vitest";

import { ogImagePath } from "~/lib/og-image";
import { canonicalUrl, pageMeta, SITE_ORIGIN } from "~/lib/seo";
import { personJsonLd, personMeta } from "~/lib/structured-data";

import { contact } from "../../content/contact";
import { profile } from "../../content/profile";
import { site } from "../../content/site";

describe("canonicalUrl", () => {
  it("is the address the page is served at, with a trailing slash", () => {
    expect(canonicalUrl("/")).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalUrl("/about")).toBe(`${SITE_ORIGIN}/about/`);
    expect(canonicalUrl("/work/ev-charging/")).toBe(
      `${SITE_ORIGIN}/work/ev-charging/`,
    );
  });

  it("drops query strings and fragments", () => {
    expect(canonicalUrl("/lab?status=active#table")).toBe(
      `${SITE_ORIGIN}/lab/`,
    );
  });
});

describe("pageMeta", () => {
  const base = { title: "Title", description: "Description", path: "/work" };

  it("sets title, description, canonical, Open Graph and Twitter tags", () => {
    expect(pageMeta(base)).toEqual([
      { title: "Title" },
      { name: "description", content: "Description" },
      { tagName: "link", rel: "canonical", href: `${SITE_ORIGIN}/work/` },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: "Title" },
      { property: "og:description", content: "Description" },
      { property: "og:url", content: `${SITE_ORIGIN}/work/` },
      { property: "og:image", content: `${SITE_ORIGIN}/og/site.png` },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: site.openGraph.site.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Title" },
      { name: "twitter:description", content: "Description" },
      { name: "twitter:image", content: `${SITE_ORIGIN}/og/site.png` },
      { name: "twitter:image:alt", content: site.openGraph.site.alt },
    ]);
  });

  it("uses a page's own image when given one", () => {
    const meta = pageMeta({
      ...base,
      image: { path: ogImagePath("ev-charging"), alt: "Card" },
    });
    const url = `${SITE_ORIGIN}/og/work/ev-charging.png`;
    expect(meta).toContainEqual({ property: "og:image", content: url });
    expect(meta).toContainEqual({ property: "og:image:alt", content: "Card" });
    expect(meta).toContainEqual({ name: "twitter:image", content: url });
  });

  it("sets the Open Graph type when asked", () => {
    expect(pageMeta({ ...base, type: "article" })).toContainEqual({
      property: "og:type",
      content: "article",
    });
  });

  it("adds a noindex robots tag only when asked", () => {
    expect(pageMeta(base)).not.toContainEqual(
      expect.objectContaining({ name: "robots" }),
    );
    expect(pageMeta({ ...base, noindex: true })).toContainEqual({
      name: "robots",
      content: "noindex",
    });
  });
});

describe("personJsonLd", () => {
  it("describes the owner from content/ only", () => {
    expect(personJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_ORIGIN}/#person`,
      name: profile.name,
      jobTitle: profile.role,
      url: `${SITE_ORIGIN}/`,
      email: `mailto:${contact.email.address}`,
      sameAs: [contact.github.href],
      knowsAbout: profile.skills.flatMap((group) => group.items),
    });
  });

  it("has no phone number or address", () => {
    const json = JSON.stringify(personJsonLd());
    expect(json).not.toMatch(/telephone|address|\+\d/i);
  });

  it("is a JSON-LD meta descriptor", () => {
    expect(personMeta()).toEqual({ "script:ld+json": personJsonLd() });
  });
});
