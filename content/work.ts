// Copy for the work index and the case study template (T-022). Validated by
// workSchema at build time (content/load.ts).
//
// Project titles, summaries, facts and bodies live in content/projects/*.mdx;
// this file holds only page titles and labels. The intro restates
// REQUIREMENTS section 4 and the client policy of D-018.
import type { Work } from "./schema";

export const work = {
  meta: {
    title: "Work · Mohamad Rida Chouman",
    description:
      "Case studies of four enterprise admin platforms in aviation, business services, EV charging and healthcare, built on one reusable foundation.",
  },
  index: {
    eyebrow: "Work",
    title: "Case studies",
    intro:
      "Four admin and operations platforms for clients in aviation, business services, EV charging and healthcare. Clients stay unnamed, and every record shown is invented.",
    linkLabel: "Read the case study",
  },
  caseStudy: {
    back: { label: "All case studies", href: "/work" },
    role: "Role",
    stack: "Stack",
    metrics: "In numbers",
    next: "Next project",
    navigationLabel: "More case studies",
    objectHint: "Drag or use the arrow keys to rotate.",
    objectFallback: "This browser cannot show the 3D model.",
  },
} satisfies Work;
