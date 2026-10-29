// Experience timeline for the About page, newest first.
// Validated by experienceSchema at build time (content/load.ts).
//
// Organizations are generic descriptions, never names (D-018). Entries marked
// "Placeholder" (and their dates) are replaced with the owner's approved timeline in T-023.
import type { Experience } from "./schema";

export const experience = [
  {
    role: "Frontend lead",
    organization: "Placeholder: generic description of the company",
    start: "2024-08",
    end: null,
    summary:
      "Placeholder: one sentence on the scope of the role, written in T-023.",
    highlights: [],
  },
] satisfies Experience;
