// Zod schemas for everything in content/ (T-020, D-007, D-025).
//
// Validation runs at build time only: react-router.config.ts calls
// loadContent() (content/load.ts) before it derives the prerender paths, so
// invalid content fails `npm run build`. The app imports only the inferred
// types (`import type`), which keeps Zod out of the client bundle.
//
// Schemas use strict objects (unknown keys are errors, which catches typos)
// and no transforms or defaults: the app reads the raw data, so what is
// validated must be exactly what is rendered.
import { z } from "zod";

const text = z.string().trim().min(1);

// Lowercase kebab-case, used for project file names and URLs.
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase kebab-case (a-z, 0-9, -)",
  );

// Year and month, e.g. "2024-08".
export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");

export const metricSchema = z.strictObject({
  value: text,
  label: text,
});

export const profileSchema = z.strictObject({
  name: text,
  role: text,
  headline: text,
  summary: text,
  metrics: z.array(metricSchema).min(1),
  story: z.array(text).min(1),
  skills: z
    .array(
      z.strictObject({
        group: text,
        items: z.array(text).min(1),
      }),
    )
    .min(1),
  education: z
    .array(
      z.strictObject({
        degree: text,
        field: text,
        institution: text,
        note: text.optional(),
      }),
    )
    .min(1),
});

export const experienceEntrySchema = z
  .strictObject({
    role: text,
    // A generic description, never a client or employer name (D-018).
    organization: text,
    start: yearMonthSchema,
    // null while the role is current.
    end: yearMonthSchema.nullable(),
    summary: text,
    highlights: z.array(text),
  })
  .refine((entry) => entry.end === null || entry.end >= entry.start, {
    message: "end must not be before start",
    path: ["end"],
  });

export const experienceSchema = z.array(experienceEntrySchema).min(1);

// YAML frontmatter of content/projects/<slug>.mdx. The slug is the file name.
export const projectFrontmatterSchema = z.strictObject({
  title: text,
  // One sentence for cards, the case study header and the meta description.
  summary: text.max(200),
  sector: text,
  role: text,
  stack: z.array(text).min(1),
  metrics: z.array(metricSchema).min(1),
  // Position in lists (1 = first). Must be unique across projects.
  order: z.int().positive(),
});

// A site path ("/work"), an in-page anchor ("#contact") or an https URL.
export const linkSchema = z.strictObject({
  label: text,
  href: z
    .string()
    .regex(
      /^(\/(?!\/)\S*|#[\w-]+|https:\/\/\S+)$/,
      "Use a site path (/work), an anchor (#contact) or an https:// URL",
    ),
});

const sectionCopy = {
  eyebrow: text,
  title: text,
};

// Copy for the home page (content/home.ts, T-021). The headline and metrics
// live in profile.ts and the selected work in the project files.
export const homeSchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text.max(200),
  }),
  hero: z.strictObject({
    actions: z.array(linkSchema).min(1).max(2),
  }),
  metrics: z.strictObject({
    title: text,
  }),
  work: z.strictObject({
    ...sectionCopy,
    intro: text,
    linkLabel: text,
    more: linkSchema,
  }),
  approach: z.strictObject({
    ...sectionCopy,
    intro: text,
    items: z
      .array(z.strictObject({ title: text, body: text }))
      .min(1)
      .max(4),
  }),
  about: z.strictObject({
    ...sectionCopy,
    body: text,
    link: linkSchema,
  }),
  contact: z.strictObject({
    ...sectionCopy,
    body: text,
    links: z.array(linkSchema).min(1),
  }),
});

// Copy for the work index (/work) and the case study template
// (/work/:slug), in content/work.ts (T-022). Project facts come from the
// project files; this holds only page titles and labels.
export const workSchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text.max(200),
  }),
  index: z.strictObject({
    ...sectionCopy,
    intro: text,
    linkLabel: text,
  }),
  caseStudy: z.strictObject({
    back: linkSchema,
    role: text,
    stack: text,
    metrics: text,
    next: text,
    // The navigation landmark around the next-project link.
    navigationLabel: text,
  }),
});

// Copy for the About page (content/about.ts, T-023). The story, skills and
// education live in profile.ts and the timeline in experience.ts.
export const aboutSchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text.max(200),
  }),
  header: z.strictObject({
    ...sectionCopy,
    intro: text,
  }),
  story: z.strictObject({ title: text }),
  experience: z.strictObject({
    title: text,
    // Shown as the end of the current role.
    present: text,
  }),
  skills: z.strictObject({ title: text }),
  education: z.strictObject({ title: text }),
  links: z.array(linkSchema).min(1).max(2),
});

// Copy for the 404 page and the generic error page (content/not-found.ts,
// T-025).
export const notFoundSchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text.max(200),
  }),
  ...sectionCopy,
  body: text,
  links: z.array(linkSchema).min(1).max(4),
  error: z.strictObject({
    title: text,
    body: text,
    link: linkSchema,
  }),
});

export type Metric = z.infer<typeof metricSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Home = z.infer<typeof homeSchema>;
export type Work = z.infer<typeof workSchema>;
export type About = z.infer<typeof aboutSchema>;
export type NotFound = z.infer<typeof notFoundSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type ProjectSummary = ProjectFrontmatter & { slug: string };
