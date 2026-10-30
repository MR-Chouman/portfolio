// Site-wide copy: header, navigation and footer (T-012).
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
