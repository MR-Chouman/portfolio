// Copy for the About page (T-023). Validated by aboutSchema at build time
// (content/load.ts).
//
// The story, skills and education come from profile.ts and the timeline from
// experience.ts; this file holds only page titles and labels. Text marked
// "Placeholder" is replaced with the owner's approved copy in T-035 (F-015).
// No headshot: the page is typographic (D-018).
import type { About } from "./schema";

export const about = {
  meta: {
    title: "About · Mohamad Rida Chouman",
    description:
      "About Mohamad Rida Chouman, a frontend lead who moved from biology and bioinformatics to building enterprise admin platforms.",
  },
  header: {
    eyebrow: "About",
    title: "From biology to frontend lead",
    intro:
      "Placeholder: a one-sentence introduction to the page, written and approved in T-035.",
  },
  story: {
    title: "Story",
  },
  experience: {
    title: "Experience",
    present: "Present",
  },
  skills: {
    title: "Skills",
  },
  education: {
    title: "Education",
  },
  links: [{ label: "See the case studies", href: "/work" }],
} satisfies About;
