// Copy for the 404 page and the generic error page (T-025). Validated by
// notFoundSchema at build time (content/load.ts).
import type { NotFound } from "./schema";

export const notFound = {
  meta: {
    title: "Page not found · Mohamad Rida Chouman",
    description:
      "This page does not exist. The case studies, the About page and the home page are a click away.",
  },
  eyebrow: "404",
  title: "This page does not exist",
  body: "The link may be old or mistyped. These pages are a good place to start:",
  links: [
    { label: "Home", href: "/" },
    { label: "Case studies", href: "/work" },
    { label: "About", href: "/about" },
  ],
  error: {
    title: "Something went wrong",
    body: "This page could not be shown. Reload it, or go back to the home page.",
    link: { label: "Back to the home page", href: "/" },
  },
} satisfies NotFound;
