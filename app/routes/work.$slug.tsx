import {
  Anchor,
  Figure,
  Link,
  Metric,
  MetricList,
  Prose,
  TagList,
} from "~/components/ui";
import { NotFound, notFoundMeta } from "~/components/sections/NotFound";
import { getNextProject, getProject } from "~/lib/projects";
import { pageMeta } from "~/lib/seo";

import { profile } from "../../content/profile";
import { work } from "../../content/work";
import type { Route } from "./+types/work.$slug";

// Case study template (T-022, REQUIREMENTS section 5): summary header with
// role, stack and metrics, the MDX body (its sections are the file's `##`
// headings, its images use <Figure>), and a link to the next project. One
// prerendered HTML file per project (T-020).
//
// No loader: the project comes from the bundled MDX modules, so client-side
// navigation needs no data request. Unknown slugs render the 404 page (T-025):
// Cloudflare serves them 404.html with a 404 status, and rendering the same
// markup here keeps hydration clean. (A thrown `data()` from a component is
// not a route error response, so it would show the generic error page.)
export function meta({ params }: Route.MetaArgs) {
  const project = getProject(params.slug);
  if (!project) return notFoundMeta();
  return pageMeta({
    title: `${project.title} · ${profile.name}`,
    description: project.summary,
    path: `/work/${project.slug}`,
    type: "article",
  });
}

// Components MDX files may use without importing them.
const mdxComponents = { Figure };

export default function CaseStudy({ params }: Route.ComponentProps) {
  const project = getProject(params.slug);
  if (!project) return <NotFound />;
  const next = getNextProject(project.slug);
  const { Content } = project;
  const copy = work.caseStudy;

  return (
    <article className="page-container pt-section">
      <p>
        <Link href={copy.back.href} variant="muted" className="text-sm">
          <span aria-hidden="true">← </span>
          {copy.back.label}
        </Link>
      </p>

      <header className="mt-8 max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {project.sector}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{project.summary}</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-x-8">
          <dt className="text-sm text-fg-muted">{copy.role}</dt>
          <dd>{project.role}</dd>
          <dt className="text-sm text-fg-muted">{copy.stack}</dt>
          <dd>
            <TagList items={project.stack} />
          </dd>
        </dl>
      </header>

      <section aria-labelledby="case-study-metrics" className="mt-10">
        <h2 id="case-study-metrics" className="sr-only">
          {copy.metrics}
        </h2>
        <MetricList className="max-w-reading">
          {project.metrics.map((metric) => (
            <Metric
              key={metric.label}
              value={metric.value}
              label={metric.label}
            />
          ))}
        </MetricList>
      </section>

      <Prose className="mt-12">
        <Content components={mdxComponents} />
      </Prose>

      {next && (
        <nav
          aria-label={copy.navigationLabel}
          className="mt-section max-w-reading border-t border-line pt-8"
        >
          <div className="group relative rounded-lg border border-line bg-surface-raised p-5 transition-colors duration-(--duration-fast) ease-standard hover:border-fg-muted has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-focus has-[a:focus-visible]:outline-solid sm:p-6">
            <p
              aria-hidden="true"
              className="font-mono text-xs tracking-wider text-accent uppercase"
            >
              {copy.next}
            </p>
            <p className="mt-2 font-display text-2xl">
              <Anchor
                href={`/work/${next.slug}`}
                className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
              >
                {/* The space sits outside the hidden span so every name
                    computation keeps it; at the line start it is collapsed. */}
                <span className="sr-only">{copy.next}:</span> {next.title}
              </Anchor>
            </p>
            <p className="mt-2 text-sm text-fg-muted">{next.summary}</p>
          </div>
          <p className="mt-6">
            <Link href={copy.back.href}>{copy.back.label}</Link>
          </p>
        </nav>
      )}
    </article>
  );
}
