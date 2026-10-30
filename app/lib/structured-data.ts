import type { MetaDescriptor } from "react-router";

import { canonicalUrl } from "./seo";
import { contact } from "../../content/contact";
import { profile } from "../../content/profile";

// JSON-LD `Person` for the home page (T-060, REQUIREMENTS section 6,
// D-050). Every field restates content/ (profile and contact), so
// the structured data never says more than the page does. No employer or
// client is named (D-018), and no phone number or address (CLAUDE.md).
export function personJsonLd() {
  const url = canonicalUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: profile.name,
    jobTitle: profile.role,
    url,
    email: `mailto:${contact.email.address}`,
    sameAs: [contact.github.href],
    knowsAbout: profile.skills.flatMap((group) => group.items),
  };
}

export function personMeta(): MetaDescriptor {
  return { "script:ld+json": personJsonLd() };
}
