// Site-wide copy: header, navigation and footer (T-012).
// Contact details and the CV link live in content/contact.ts (T-024, D-018).
export const site = {
  name: "Mohamad Rida Chouman",
  role: "Frontend lead",
  skipLink: "Skip to content",
  navigationLabel: "Main",
  themeToggle: "Dark theme",
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
