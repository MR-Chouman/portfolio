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

export type Metric = z.infer<typeof metricSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type ProjectSummary = ProjectFrontmatter & { slug: string };
