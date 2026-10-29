// Copy for the home page (T-021). Validated by homeSchema at build time
// (content/load.ts).
//
// The hero headline and metrics come from profile.ts and the selected work
// from content/projects/*.mdx. Titles below restate facts from REQUIREMENTS
// sections 3 and 4 only; text marked "Placeholder" is replaced with the
// owner's approved copy in T-035 (F-012). Email and CV links are added to the
// contact block in T-024 (D-018).
import type { Home } from "./schema";

export const home = {
  meta: {
    title: "Mohamad Rida Chouman · Frontend lead",
    description:
      "Portfolio of Mohamad Rida Chouman, a frontend lead building enterprise admin platforms on one reusable foundation.",
  },
  hero: {
    actions: [
      { label: "See selected work", href: "#work" },
      { label: "Get in touch", href: "#contact" },
    ],
  },
  metrics: {
    title: "In numbers",
  },
  work: {
    eyebrow: "Selected work",
    title: "Four platforms, one foundation",
    intro:
      "Admin and operations platforms for clients in aviation, business services, EV charging and healthcare. Clients stay unnamed.",
    linkLabel: "Read the case study",
    more: { label: "All case studies", href: "/work" },
  },
  approach: {
    eyebrow: "How I build",
    title: "Reusable foundations first",
    intro:
      "Placeholder: one sentence on the approach, written and approved in T-035.",
    items: [
      {
        title: "One foundation, many platforms",
        body: "Placeholder: how one reusable foundation carries four platforms, written in T-035.",
      },
      {
        title: "A shared data layer",
        body: "Placeholder: shared CRUD screens, server-side tables and the API layer, written in T-035.",
      },
      {
        title: "A component library",
        body: "Placeholder: the shared component library behind the screens, written in T-035.",
      },
    ],
  },
  about: {
    eyebrow: "About",
    title: "From biology to frontend lead",
    body: "Placeholder: a two-sentence teaser of the path from biology to bioinformatics (MSc, machine learning on protein sequences) to frontend lead, written and approved in T-035.",
    link: { label: "More about me", href: "/about" },
  },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    body: "Placeholder: a short invitation to get in touch, written in T-035. Email and CV links are added in T-024.",
    links: [{ label: "GitHub profile", href: "https://github.com/MR-Chouman" }],
  },
} satisfies Home;
