import { describe, expect, it } from "vitest";

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
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Title" },
      { name: "twitter:description", content: "Description" },
    ]);
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
