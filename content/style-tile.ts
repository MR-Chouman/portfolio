// Copy for the internal style tile (/style-tile, T-011). Not indexed.
// The work row uses the public, generic project description (D-018).
export const styleTile = {
  meta: {
    title: "Style tile · Editorial skin",
    description:
      "Colors, type scale, buttons and a work row of the Editorial skin, in light and dark.",
  },
  heading: "Style tile",
  intro:
    "The Editorial skin's tokens and base elements, shown side by side in both themes.",
  themes: {
    light: "Light theme",
    dark: "Dark theme",
  },
  sections: {
    colors: "Colors",
    type: "Type scale",
    buttons: "Buttons",
    work: "Work row",
  },
  colors: {
    surface: "Page background",
    "surface-raised": "Cards and panels",
    fg: "Text and headings",
    "fg-muted": "Secondary text",
    line: "Dividers",
    accent: "Links and primary actions",
    "accent-fg": "Text on accent",
    focus: "Focus ring",
  },
  type: {
    display: "Admin platforms on one foundation",
    body: "Four platforms and more than 260 screens, built quickly on reusable parts.",
    mono: "260+ screens · 57 shared components",
  },
  buttons: {
    primary: "Download CV",
    secondary: "View work",
    ghost: "Read the case study",
  },
  work: {
    title: "Airline crew management platform",
    sector: "Aviation",
    summary:
      "Rostering, attendance, leave, appraisals, qualifications and training in one admin platform.",
    metric: "25 modules",
    stack: ["Next.js", "TypeScript", "Microsoft SSO"],
    link: "Read the case study",
  },
} as const;
