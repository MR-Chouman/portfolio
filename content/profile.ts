// The owner's profile: hero, metrics, About story, skills, education.
// Validated by profileSchema at build time (content/load.ts).
//
// Final copy from T-035. Numbers match REQUIREMENTS section 4; every other
// fact restates the owner's published CV (public/cv.pdf). Clients and
// employers are never named (D-018).
import type { Profile } from "./schema";

export const profile = {
  name: "Mohamad Rida Chouman",
  role: "Frontend lead",
  headline:
    "Frontend lead building enterprise admin platforms: 4 systems, 260+ screens, one reusable foundation.",
  summary:
    "I lead a frontend team that builds administration and operations platforms for clients in aviation, business services, EV charging and healthcare. Shared component libraries and reusable CRUD and server-side table patterns keep new screens quick to build and every platform consistent.",
  metrics: [
    { value: "4", label: "Admin platforms" },
    { value: "260+", label: "Admin screens" },
    { value: "~3 yrs", label: "Experience" },
  ],
  // The About story, one string per paragraph, following the arc in
  // REQUIREMENTS section 4.
  story: [
    "I started in biology, with a bachelor's degree from the Lebanese University in 2018.",
    "From there I moved to bioinformatics. My MSc thesis used machine learning (Random Forest, XGBoost, LightGBM and ensemble models) to predict SNO sites in protein sequences.",
    "In 2023 I switched to software through a full-stack bootcamp, worked as an application analyst, and joined a software company as a frontend developer in August 2024. Since January 2026 I have led its frontend team across four client platforms, built on shared component libraries and reusable CRUD and server-side table patterns.",
  ],
  skills: [
    {
      group: "Frameworks",
      items: ["React", "Next.js (App Router)", "React Router"],
    },
    {
      group: "Languages",
      items: ["TypeScript", "JavaScript", "HTML", "CSS"],
    },
    {
      group: "State and data",
      items: ["Redux Toolkit", "RTK Query", "TanStack Query"],
    },
    {
      group: "Styling and UI",
      items: ["Tailwind CSS", "PrimeReact"],
    },
    {
      group: "Testing and quality",
      items: ["Vitest", "React Testing Library", "Playwright", "ESLint"],
    },
  ],
  education: [
    {
      degree: "MSc",
      field: "Bioinformatics",
      institution: "Tarbiat Modares University",
      note: "Thesis: predicting SNO sites in proteins with machine learning.",
    },
    {
      degree: "BSc",
      field: "Biology",
      institution: "Lebanese University",
    },
    {
      degree: "Certificate",
      field: "Full-stack web development",
      institution: "SEF Full Stack Web Developer Bootcamp",
      note: "2023.",
    },
  ],
} satisfies Profile;
