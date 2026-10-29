// Public contact details and the CV download (T-024). Validated by
// contactSchema at build time (content/load.ts).
//
// D-018: the pages show the email address (mailto:) and the GitHub profile
// only. No LinkedIn and no phone number here; the phone number may appear
// only inside the CV PDF the owner adds to public/ (F-008).
import type { Contact } from "./schema";

export const contact = {
  // The Gmail address the CV uses (F-003, F-004).
  email: {
    label: "Email",
    address: "choumanmohamadrida@gmail.com",
  },
  github: {
    label: "GitHub profile",
    href: "https://github.com/MR-Chouman",
  },
  // The PDF lives at public/cv.pdf, added by the owner (F-008).
  cv: {
    label: "Download CV",
    shortLabel: "CV",
    format: "PDF",
    href: "/cv.pdf",
    fileName: "Mohamad-Rida-Chouman-CV.pdf",
  },
} satisfies Contact;
