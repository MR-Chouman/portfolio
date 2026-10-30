import {
  ButtonLink,
  Link,
  Metric,
  MetricList,
  Section,
  WorkRow,
} from "~/components/ui";
import { projects } from "~/lib/projects";
import { pageMeta } from "~/lib/seo";

import { contact as contactDetails } from "../../content/contact";
import { home } from "../../content/home";
import { profile } from "../../content/profile";
import type { Route } from "./+types/home";

// Home page (T-021, REQUIREMENTS section 5): hero, metrics strip, selected
// work, "How I build", About teaser and contact. All copy comes from
// content/; the work list is every project, in display order.
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...home.meta, path: "/" });
}

// In-page targets keep clear of the viewport edge when jumped to.
const anchorTarget = "scroll-mt-8";

export default function Home() {
  const { hero, metrics, work, approach, about, contact } = home;

  return (
    <div className="page-container">
      <div className="pt-section">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {profile.name} · {profile.role}
        </p>
        <h1 className="mt-4 max-w-[22ch] text-4xl sm:text-5xl">
          {profile.headline}
        </h1>
        <p className="mt-6 max-w-reading text-lg text-fg-muted">
          {profile.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {hero.actions.map((action, index) => (
            <ButtonLink
              key={action.href}
              href={action.href}
              variant={index === 0 ? "primary" : "secondary"}
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>
      </div>

      <section aria-labelledby="metrics-title" className="mt-16">
        <h2 id="metrics-title" className="sr-only">
          {metrics.title}
        </h2>
        <MetricList>
          {profile.metrics.map((metric) => (
            <Metric
              key={metric.label}
              value={metric.value}
              label={metric.label}
            />
          ))}
        </MetricList>
      </section>

      <Section
        id="work"
        eyebrow={work.eyebrow}
        title={work.title}
        intro={work.intro}
        className={`mt-section ${anchorTarget}`}
      >
        <ul className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => {
            const [metric] = project.metrics;
            return (
              <li key={project.slug} className="grid">
                <WorkRow
                  href={`/work/${project.slug}`}
                  title={project.title}
                  sector={project.sector}
                  summary={project.summary}
                  metric={`${metric.value} ${metric.label.toLowerCase()}`}
                  stack={project.stack}
                  linkLabel={work.linkLabel}
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-8">
          <Link href={work.more.href}>{work.more.label}</Link>
        </p>
      </Section>

      <Section
        eyebrow={approach.eyebrow}
        title={approach.title}
        intro={approach.intro}
        className="mt-section"
      >
        <ol className="grid gap-6 md:grid-cols-3">
          {approach.items.map((item, index) => (
            <li key={item.title} className="border-t border-line pt-4">
              <p aria-hidden="true" className="font-mono text-sm text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl">{item.title}</h3>
              <p className="mt-2 text-fg-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <div className="mt-section grid gap-section lg:grid-cols-2 lg:gap-12">
        <Section
          eyebrow={about.eyebrow}
          title={about.title}
          className="rounded-xl border border-line bg-surface-raised p-6 sm:p-8"
        >
          <p className="max-w-reading text-fg-muted">{about.body}</p>
          <p className="mt-6">
            <Link href={about.link.href}>{about.link.label}</Link>
          </p>
        </Section>

        <Section
          id="contact"
          eyebrow={contact.eyebrow}
          title={contact.title}
          className={`rounded-xl border border-line p-6 sm:p-8 ${anchorTarget}`}
        >
          <p className="max-w-reading text-fg-muted">{contact.body}</p>
          <ul className="mt-6 flex flex-wrap gap-3">
            <li>
              <ButtonLink
                href={`mailto:${contactDetails.email.address}`}
                aria-label={`${contactDetails.email.label} ${contactDetails.email.address}`}
              >
                {contactDetails.email.address}
              </ButtonLink>
            </li>
            <li>
              <ButtonLink
                href={contactDetails.cv.href}
                download={contactDetails.cv.fileName}
                type="application/pdf"
                variant="secondary"
              >
                {contactDetails.cv.label}
                <span className="font-mono text-xs text-fg-muted">
                  {contactDetails.cv.format}
                </span>
              </ButtonLink>
            </li>
            <li>
              <ButtonLink href={contactDetails.github.href} variant="secondary">
                {contactDetails.github.label}
              </ButtonLink>
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
