import { data } from "react-router";

import { Metric, MetricList, Prose, TagList } from "~/components/ui";
import { getProject } from "~/lib/projects";
import { pageMeta } from "~/lib/seo";

import { profile } from "../../content/profile";
import type { Route } from "./+types/work.$slug";

// Case study page, one prerendered HTML file per project (T-020). Minimal on
// purpose: it proves the MDX pipeline and per-slug prerendering. The full
// template (sections, images, next project) is T-022.
//
// No loader: the project comes from the bundled MDX modules, so client-side
// navigation needs no data request. Unknown slugs reach this route through
// the SPA fallback and throw; T-025 turns that into the proper 404 page.
export function meta({ params }: Route.MetaArgs) {
  const project = getProject(params.slug);
  if (!project) return [];
  return pageMeta({
    title: `${project.title} · ${profile.name}`,
    description: project.summary,
    path: `/work/${project.slug}`,
  });
}

export default function CaseStudy({ params }: Route.ComponentProps) {
  const project = getProject(params.slug);
  if (!project) throw data(null, { status: 404 });
  const { Content } = project;

  return (
    <article className="page-container pt-section">
      <header className="max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {project.sector}
        </p>
        <h1 className="mt-2 text-4xl">{project.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{project.summary}</p>
        <TagList items={project.stack} className="mt-6" />
      </header>
      <MetricList className="mt-10 max-w-reading">
        {project.metrics.map((metric) => (
          <Metric
            key={metric.label}
            value={metric.value}
            label={metric.label}
          />
        ))}
      </MetricList>
      <Prose className="mt-12 max-w-reading">
        <Content />
      </Prose>
    </article>
  );
}
