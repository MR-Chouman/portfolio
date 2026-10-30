// Copy for the About page (T-023). Validated by aboutSchema at build time
// (content/load.ts).
//
// The story, skills and education come from profile.ts and the timeline from
// experience.ts; this file holds only page titles, labels and the intro
// (final copy from T-035).
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
      "How a biology graduate became a frontend lead, and the work along the way.",
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
