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
// The models app/components/three/models.ts can build (T-034).
export const projectObjectKinds = [
  "airplane",
  "pallet",
  "charger",
  "hospital-bed",
] as const;

export type ProjectObjectKind = (typeof projectObjectKinds)[number];

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
  // The rotatable 3D object in the case study header (T-034, D-032): which
  // model stands for the project, and its accessible name.
  object: z.strictObject({
    kind: z.enum(projectObjectKinds),
    label: text,
  }),
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
  // The email, CV and GitHub links come from content/contact.ts.
  contact: z.strictObject({
    ...sectionCopy,
    body: text,
  }),
});

// Public contact details and the CV download (content/contact.ts, T-024).
// Only the email address and the GitHub profile are published (D-018).
export const contactSchema = z.strictObject({
  email: z.strictObject({
    label: text,
    address: z.email(),
  }),
  github: z.strictObject({
    label: text,
    href: z.url({ protocol: /^https$/ }),
  }),
  cv: z.strictObject({
    label: text,
    // The visible text of the compact header link; the full label stays the
    // accessible name.
    shortLabel: text,
    // The name of the header and contact links, which open the preview.
    previewLabel: text,
    format: text,
    // A PDF at the root of public/.
    href: z.string().regex(/^\/[a-z0-9-]+\.pdf$/, "Use a /name.pdf path"),
    // The file name the browser saves the download as.
    fileName: z
      .string()
      .regex(/^[\w-]+\.pdf$/, "Use a file name such as Name-CV.pdf"),
    // The CV preview dialog (T-056): its heading, the frame's title, the
    // buttons, and the note shown where the browser cannot show a PDF inline.
    preview: z.strictObject({
      title: text,
      frameTitle: text,
      close: text,
      open: text,
      download: text,
      fallback: text,
    }),
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
    // Under the 3D object: how to rotate it, and the text shown instead
    // when the browser cannot draw it (no WebGL).
    objectHint: text,
    objectFallback: text,
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

// Copy for the lab page (/lab) and its data table demo (content/lab.ts,
// T-051). The demo records are invented (D-044); this holds the page copy,
// the table labels and the display names of the record fields' values.
const labelsOf = <const K extends string>(keys: readonly K[]) =>
  z.strictObject(
    Object.fromEntries(keys.map((key) => [key, text])) as Record<
      K,
      typeof text
    >,
  );

// A title and the primitives it shows, per gallery block (T-053).
const blockCopy = z.strictObject({ title: text, components: text });
const blocksOf = <const K extends string>(keys: readonly K[]) =>
  z.strictObject(
    Object.fromEntries(keys.map((key) => [key, blockCopy])) as Record<
      K,
      typeof blockCopy
    >,
  );

export const labSchema = z.strictObject({
  meta: z.strictObject({
    title: text,
    description: text.max(200),
  }),
  header: z.strictObject({
    ...sectionCopy,
    intro: text,
  }),
  table: z.strictObject({
    ...sectionCopy,
    intro: text,
    caption: text,
    regionLabel: text,
    columns: labelsOf([
      "id",
      "name",
      "category",
      "status",
      "site",
      "value",
      "updatedAt",
    ]),
    filters: z.strictObject({
      label: text,
      search: text,
      searchHint: text,
      status: text,
      category: text,
      site: text,
      clear: text,
    }),
    values: z.strictObject({
      status: labelsOf(["active", "maintenance", "reserved", "retired"]),
      category: labelsOf(["vehicle", "machinery", "it", "tooling", "safety"]),
    }),
    pagination: z.strictObject({
      label: text,
      pageSize: text,
      previous: text,
      next: text,
      first: text,
      last: text,
      // "{from}–{to} of {total}" and "Page {page} of {pageCount}".
      range: text.includes("{from}").includes("{to}").includes("{total}"),
      page: text.includes("{page}").includes("{pageCount}"),
    }),
    loading: text,
    empty: z.strictObject({
      title: text,
      body: text,
    }),
    error: z.strictObject({
      title: text,
      body: text,
      retry: text,
    }),
    simulate: z.strictObject({
      label: text,
      hint: text,
    }),
  }),
  // The create and edit drawer (T-052). "{name}" and "{id}" are filled in.
  crud: z.strictObject({
    hint: text,
    create: text,
    edit: text.includes("{name}"),
    editShort: text,
    actions: text,
    newId: text,
    saving: text,
    saved: text.includes("{name}"),
    failed: z.strictObject({
      title: text.includes("{name}"),
      body: text,
      dismiss: text,
    }),
    drawer: z.strictObject({
      createTitle: text,
      editTitle: text.includes("{id}"),
      intro: text,
      close: text,
      cancel: text,
      save: text,
      choose: text,
      fields: labelsOf(["name", "category", "status", "site", "value"]),
      valueHint: text,
      fail: z.strictObject({
        label: text,
        hint: text,
      }),
    }),
    // One message per validation error code (app/lib/lab/asset-form.ts).
    errors: labelsOf([
      "nameRequired",
      "nameShort",
      "nameLong",
      "categoryRequired",
      "statusRequired",
      "siteRequired",
      "valueRequired",
      "valueWhole",
      "valueMax",
    ]),
  }),
  // The component gallery (T-053): the primitives in both themes and every
  // accent. Each block names the primitives it shows; `variants` are the
  // captions above each sample.
  gallery: z.strictObject({
    ...sectionCopy,
    intro: text,
    themes: labelsOf(["light", "dark"]),
    blocks: blocksOf([
      "buttons",
      "links",
      "tags",
      "fields",
      "chips",
      "status",
      "metrics",
      "accents",
    ]),
    variants: labelsOf([
      "primary",
      "secondary",
      "ghost",
      "small",
      "disabled",
      "link",
      "accent",
      "muted",
      "neutral",
      "list",
      "default",
      "hint",
      "select",
      "invalid",
      "unchecked",
      "checked",
    ]),
    samples: z.strictObject({
      buttons: labelsOf(["primary", "secondary", "ghost", "small", "link"]),
      links: labelsOf(["accent", "muted"]),
      tags: z.strictObject({
        neutral: text,
        accent: text,
        list: z.array(text).min(1),
      }),
      fields: z.strictObject({
        text: z.strictObject({ label: text, value: text }),
        hint: z.strictObject({ label: text, value: text, hint: text }),
        select: z.strictObject({ label: text }),
        invalid: z.strictObject({ label: text, value: text, error: text }),
        disabled: z.strictObject({ label: text, value: text }),
      }),
      chips: labelsOf(["unchecked", "checked", "disabled"]),
      metrics: z.array(metricSchema).min(1),
      // The accent rows: "{accent}" is filled with the accent's name.
      accentRow: text.includes("{accent}"),
      accentSamples: labelsOf(["button", "link", "tag", "chip"]),
    }),
  }),
});

export type Metric = z.infer<typeof metricSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Home = z.infer<typeof homeSchema>;
export type Work = z.infer<typeof workSchema>;
export type About = z.infer<typeof aboutSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type NotFound = z.infer<typeof notFoundSchema>;
export type Lab = z.infer<typeof labSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type ProjectSummary = ProjectFrontmatter & { slug: string };
