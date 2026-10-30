// Copy for the home page (T-021). Validated by homeSchema at build time
// (content/load.ts).
//
// The hero headline and metrics come from profile.ts and the selected work
// from content/projects/*.mdx. Titles below restate facts from REQUIREMENTS
// sections 3 and 4; the body copy is the final copy from T-035, restating the
// owner's published CV (public/cv.pdf). The contact block's email, CV and
// GitHub links come from content/contact.ts (T-024, D-018).
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
      "The same building blocks carry every platform, so new screens come together quickly and look and behave alike.",
    items: [
      {
        title: "One foundation, many platforms",
        body: "Component libraries built for earlier projects became the starting point for later ones, so aviation, business services, EV charging and healthcare platforms share one set of patterns.",
      },
      {
        title: "A shared data layer",
        body: "Shared CRUD and server-side table patterns let every new screen reuse one data layer. On the EV charging platform, a 50-module API layer serves 132 screens.",
      },
      {
        title: "A component library",
        body: "A shared library of 57 components carries the 33 screens of the hospital platform, from patient registration to barcodes, printed documents and Excel reports.",
      },
    ],
  },
  about: {
    eyebrow: "About",
    title: "From biology to frontend lead",
    body: "I studied biology, then took an MSc in bioinformatics, applying machine learning to protein sequences. Today I lead a frontend team building enterprise admin platforms with React, Next.js and TypeScript.",
    link: { label: "More about me", href: "/about" },
  },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    body: "Open to remote roles and collaborations, including with teams across the Middle East. Email is the quickest way to reach me.",
  },
} satisfies Home;
