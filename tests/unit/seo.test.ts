import { describe, expect, it } from "vitest";

import { pageMeta, SITE_ORIGIN } from "~/lib/seo";

describe("pageMeta", () => {
  const base = { title: "Title", description: "Description", path: "/work" };

  it("sets title, description, canonical and Open Graph tags", () => {
    expect(pageMeta(base)).toEqual([
      { title: "Title" },
      { name: "description", content: "Description" },
      { tagName: "link", rel: "canonical", href: `${SITE_ORIGIN}/work` },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Title" },
      { property: "og:description", content: "Description" },
      { property: "og:url", content: `${SITE_ORIGIN}/work` },
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
