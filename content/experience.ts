// Experience timeline for the About page, newest first.
// Validated by experienceSchema at build time (content/load.ts).
//
// Final copy from T-035, restating the owner's published CV (public/cv.pdf).
// Organizations are generic descriptions, never names (D-018).
import type { Experience } from "./schema";

export const experience = [
  {
    role: "Frontend lead",
    organization: "A software company building client platforms",
    start: "2026-01",
    end: null,
    summary:
      "Lead the frontend team across four client platforms, overseeing development, code quality and delivery timelines.",
    highlights: [
      "Launched three platforms in 2026 (airline crew management, business operations and EV charging), together covering 230+ admin screens.",
      "Own the hospital management platform end to end: built it from August 2024 and have led it since January 2026.",
      "Established the shared component libraries and the reusable CRUD and server-side table patterns the platforms build on.",
    ],
  },
  {
    role: "Frontend developer",
    organization: "The software group the company was spun off from",
    start: "2024-08",
    end: "2026-01",
    summary:
      "Built responsive admin panels, rental systems and internal dashboards with React, Redux and Tailwind.",
    highlights: [
      "Built reusable component libraries that became the foundation for later projects.",
    ],
  },
  {
    role: "Application analyst",
    organization: "A restaurant group",
    start: "2024-01",
    end: "2024-08",
    summary:
      "Analyzed requirements, documented technical specifications, tested systems and supported staff in daily operations.",
    highlights: [],
  },
] satisfies Experience;
