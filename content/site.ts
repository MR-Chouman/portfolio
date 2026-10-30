// Site-wide copy: header, navigation, footer and preferences (T-012).
// Contact details and the CV link live in content/contact.ts (T-024, D-018).
export const site = {
  name: "Mohamad Rida Chouman",
  role: "Frontend lead",
  skipLink: "Skip to content",
  navigationLabel: "Main",
  themeToggle: "Dark theme",
  // The command palette (T-043), opened with Ctrl/Cmd+K or the header
  // button. The CV command uses the labels in content/contact.ts.
  commandPalette: {
    open: "Open command palette",
    label: "Command palette",
    inputLabel: "Search commands",
    placeholder: "Type a command or search",
    listLabel: "Commands",
    empty: "No matching commands",
    groups: {
      pages: "Pages",
      work: "Case studies",
      preferences: "Preferences",
      files: "Files",
    },
    home: "Home",
    caseStudy: "Case study",
    theme: {
      dark: "Switch to dark theme",
      light: "Switch to light theme",
    },
    themeOn: { dark: "Dark theme on", light: "Light theme on" },
    // One command per accent: "<name> accent", announced as
    // "<name> accent on". The names come from `accents` below.
    accent: "accent",
    accentOn: "accent on",
  },
  // The accent colors a visitor can choose (T-046, D-038), in the order of
  // app/lib/accent.ts. Used by the command palette and the floating palette.
  accents: {
    label: "Accent color",
    // The floating palette (T-047): the phone button is named
    // "<label>: <name>", and a choice is announced as "<name> <on>".
    on: "accent on",
    names: {
      green: "Green",
      purple: "Purple",
      gold: "Gold",
      red: "Red",
      blue: "Blue",
      orange: "Orange",
    },
  },
  // Text on the generated Open Graph cards (T-061, D-051) and their alt text.
  // Case study cards show the project's title, summary and sector from its
  // frontmatter; the site card shows the profile's name and headline.
  openGraph: {
    site: {
      eyebrow: "Portfolio",
      alt: "Portfolio card of Mohamad Rida Chouman, frontend lead",
    },
    // The case study card's alt text is "<alt>: <project title>".
    caseStudy: { eyebrow: "Case study", alt: "Case study card" },
  },
  navigation: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Lab", href: "/lab" },
  ],
  footer: {
    lastUpdated: "Last updated",
    source: {
      label: "Source on GitHub",
      href: "https://github.com/MR-Chouman/portfolio",
    },
  },
} as const;
