// Copy for the internal style tile (/style-tile, T-011, T-013). Not indexed.
// Samples use public, generic project facts (REQUIREMENTS section 4, D-018).
export const styleTile = {
  meta: {
    title: "Style tile · Mohamad Rida Chouman",
    description: "The site's tokens and UI primitives, in light and dark.",
  },
  heading: "Style tile",
  intro:
    "The site's tokens and UI primitives, shown side by side in both themes. Each block names the primitive it uses.",
  themes: {
    light: "Light theme",
    dark: "Dark theme",
  },
  sections: {
    colors: { title: "Colors", components: "Tokens" },
    type: { title: "Type scale", components: "Tokens" },
    buttons: { title: "Buttons", components: "Button · ButtonLink" },
    links: { title: "Links", components: "Link" },
    tags: { title: "Tags", components: "Tag · TagList" },
    metrics: { title: "Metrics", components: "MetricList · Metric" },
    prose: { title: "Prose", components: "Prose" },
    work: { title: "Work row", components: "WorkRow" },
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
    ghost: "Contact",
    small: "Small",
    disabled: "Disabled",
  },
  links: {
    accent: "Read the case study",
    muted: "Source on GitHub",
  },
  tags: {
    neutral: "React",
    accent: "Lead",
    list: ["React", "Redux Toolkit", "Tailwind CSS"],
  },
  metrics: [
    { value: "4", label: "Admin platforms" },
    { value: "260+", label: "Admin screens" },
    { value: "57", label: "Shared components" },
  ],
  prose: {
    paragraph:
      "Each platform started from the same foundation: a data table driven by the server, a create and edit drawer, and a small set of form fields.",
    list: [
      "Shared CRUD screens instead of one-off pages",
      "Server-side sorting, filtering and pagination",
      "Print, barcode and Excel export where operations need them",
    ],
    quote: "Reuse first, then speed follows.",
  },
  work: {
    title: "Airline crew management platform",
    sector: "Aviation",
    summary:
      "Rostering, attendance, leave, appraisals, qualifications and training in one admin platform.",
    metric: "25 modules",
    stack: ["Next.js", "TypeScript", "Microsoft SSO"],
    linkLabel: "Read the case study",
  },
} as const;
