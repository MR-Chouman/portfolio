// The owner's profile: hero, metrics, About story, skills, education.
// Validated by profileSchema at build time (content/load.ts).
//
// Facts and numbers come from REQUIREMENTS section 4. Text marked
// "Placeholder" is replaced with the owner's approved copy in T-023 and T-035.
import type { Profile } from "./schema";

export const profile = {
  name: "Mohamad Rida Chouman",
  role: "Frontend lead",
  // Direction from REQUIREMENTS section 3; final wording in T-035.
  headline:
    "Frontend lead building enterprise admin platforms: 4 systems, 260+ screens, one reusable foundation.",
  summary:
    "Placeholder: a two-sentence introduction, written and approved in T-035.",
  metrics: [
    { value: "4", label: "Admin platforms" },
    { value: "260+", label: "Admin screens" },
    { value: "~3 yrs", label: "Experience" },
  ],
  story: [
    "Placeholder: the short first-person story (biology, then bioinformatics, then frontend lead), written and approved in T-023.",
  ],
  skills: [
    {
      group: "Frameworks",
      items: ["React", "Next.js"],
    },
    {
      group: "Languages",
      items: ["TypeScript"],
    },
    {
      group: "State and styling",
      items: ["Redux Toolkit", "Tailwind CSS"],
    },
  ],
  education: [
    {
      degree: "MSc",
      field: "Bioinformatics",
      institution: "Placeholder: university, confirmed in T-023",
      note: "Machine learning on protein sequences.",
    },
  ],
} satisfies Profile;
