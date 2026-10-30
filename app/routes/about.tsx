import { Link, Prose, Section, TagList } from "~/components/ui";
import { formatYearMonth } from "~/lib/date";
import { pageMeta } from "~/lib/seo";

import { about } from "../../content/about";
import { experience } from "../../content/experience";
import { profile } from "../../content/profile";
import type { Route } from "./+types/about";

// About page (T-023, REQUIREMENTS section 5): a short first-person story,
// the experience timeline, skills and education. Page copy comes from
// content/about.ts, the rest from profile.ts and experience.ts. Typographic,
// no headshot (D-018).
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...about.meta, path: "/about" });
}

export default function About() {
  const { header, story, skills, education, links } = about;

  return (
    <div className="page-container pt-section">
      <header className="max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {header.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{header.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{header.intro}</p>
      </header>

      <Section title={story.title} className="mt-section">
        <Prose className="max-w-reading">
          {profile.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </Section>

      <Section title={about.experience.title} className="mt-section">
        <ol className="grid max-w-reading gap-8 border-l border-line pl-6">
          {experience.map((entry) => (
            <li key={`${entry.start}-${entry.role}`}>
              <p className="font-mono text-sm text-fg-muted">
                <time dateTime={entry.start}>
                  {formatYearMonth(entry.start)}
                </time>
                {" – "}
                {entry.end ? (
                  <time dateTime={entry.end}>{formatYearMonth(entry.end)}</time>
                ) : (
                  about.experience.present
                )}
              </p>
              <h3 className="mt-1 text-xl">{entry.role}</h3>
              <p className="text-fg-muted">{entry.organization}</p>
              <p className="mt-3">{entry.summary}</p>
              {entry.highlights.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-fg-muted">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <div className="mt-section grid gap-section lg:grid-cols-2 lg:gap-12">
        <Section title={skills.title}>
          <ul className="grid gap-6">
            {profile.skills.map((group) => (
              <li key={group.group}>
                <h3 className="text-lg">{group.group}</h3>
                <TagList items={group.items} className="mt-2" />
              </li>
            ))}
          </ul>
        </Section>

        <Section title={education.title}>
          <ul className="grid gap-6">
            {profile.education.map((entry) => (
              <li key={`${entry.degree}-${entry.field}`}>
                <h3 className="text-lg">
                  {entry.degree}, {entry.field}
                </h3>
                <p className="text-fg-muted">{entry.institution}</p>
                {entry.note && <p className="mt-2">{entry.note}</p>}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <ul className="mt-section flex flex-wrap gap-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
